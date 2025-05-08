const pdfParse = require("pdf-parse");
const axios = require("axios");
const Summary = require("../models/summaryModel");
const TimelineEvent = require("../models/timelineModel");
const File = require("../models/fileModel");
const { PDFDocument } = require('pdf-lib');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function extractTextFromPDF(pdfBuffer) {
  try {
    // First try with pdf-parse
    try {
      const parsed = await pdfParse(pdfBuffer);
      if (parsed.text && parsed.text.length > 30) {
        return parsed.text;
      }
    } catch (pdfParseError) {
      console.log("pdf-parse failed, trying alternative method:", pdfParseError.message);
    }

    // If pdf-parse fails, try with pdf-lib
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      let text = '';
      
      for (const page of pages) {
        const { extractedText } = await page.extractText();
        text += extractedText + '\n';
      }

      if (text.length > 30) {
        return text;
      }
    } catch (pdfLibError) {
      console.log("pdf-lib extraction failed:", pdfLibError.message);
    }

    throw new Error("Could not extract text from PDF");
  } catch (error) {
    throw error;
  }
}

exports.summarizePDF = async (req, res) => {
  const { fileUrl, fileId } = req.body;

  if (!fileUrl || !fileId) {
    return res.status(400).json({ msg: "Missing file URL or file ID" });
  }

  try {
    // Check if summary exists in cache
    const existingSummary = await Summary.findOne({ fileId });
    if (existingSummary) {
      return res.json({ summary: existingSummary.summary, fromCache: true });
    }

    // If not in cache, generate new summary
    const pdfResponse = await axios.get(fileUrl, {
      responseType: "arraybuffer",
    });

    const pdfBuffer = Buffer.from(pdfResponse.data, "binary");
    
    // Try to extract text using our enhanced function
    let textContent;
    try {
      textContent = await extractTextFromPDF(pdfBuffer);
    } catch (extractError) {
      console.error("Text extraction failed:", extractError);
      return res.status(400).json({ 
        msg: "Could not extract text from PDF. The file might be corrupted, password-protected, or in an unsupported format.",
        error: extractError.message 
      });
    }

    if (!textContent || textContent.length < 30) {
      return res.status(400).json({ msg: "PDF text content is too short or missing." });
    }

    // Generate summary
    const summaryPrompt = `Summarize this medical report:\n${textContent}`;
    const summaryResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: summaryPrompt }] }]
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    // Clean up the summary response and remove any markdown or code blocks
    let summary = summaryResponse.data.candidates[0].content.parts[0].text;
    summary = summary
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\*\*/g, '')           // Remove bold markers
      .replace(/\n{3,}/g, '\n\n')     // Normalize multiple newlines
      .trim();

    // Store the summary in cache
    const savedSummary = await Summary.create({
      fileId,
      summary
    });

    // Extract timeline events with a simpler prompt
    const timelinePrompt = `Extract key medical events from this text. For each event, provide:
    1. The date it occurred (if mentioned)
    2. What type of event it was (diagnosis, treatment, medication, test, surgery, or follow-up)
    3. A brief description
    4. How critical it was (low, medium, high, or critical)
    5. Any related medical conditions
    6. Any medications mentioned

    Format each event as a new line starting with "EVENT:" followed by the details.

    Text content:
    ${textContent}`;

    const timelineResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: timelinePrompt }] }]
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    // Process the response text into structured events
    const responseText = timelineResponse.data.candidates[0].content.parts[0].text;
    const eventLines = responseText.split('\n').filter(line => line.trim().startsWith('EVENT:'));
    
    const timelineEvents = eventLines.map(line => {
      const eventText = line.replace('EVENT:', '').trim();
      // Extract date if it exists (looking for YYYY-MM-DD format or other common date formats)
      const dateMatch = eventText.match(/\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}/i);
      const date = dateMatch ? new Date(dateMatch[0]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      // Determine event type
      const typeMatch = eventText.match(/diagnosis|treatment|medication|test|surgery|follow-up/i);
      const eventType = typeMatch ? typeMatch[0].charAt(0).toUpperCase() + typeMatch[0].slice(1) : 'Documentation';

      // Determine severity
      const severityMatch = eventText.match(/critical|high|medium|low/i);
      const severity = severityMatch ? severityMatch[0].charAt(0).toUpperCase() + severityMatch[0].slice(1) : 'Low';

      // Extract medications (looking for common medication patterns)
      const medicationMatches = eventText.match(/\b[A-Za-z]+\s+\d+\s*(?:mg|mcg|g|ml)\b/g) || [];
      const medications = medicationMatches.map(med => ({
        name: med.match(/[A-Za-z]+/)[0],
        dosage: med.match(/\d+\s*(?:mg|mcg|g|ml)/)[0],
        frequency: 'As prescribed'
      }));

      // Extract conditions (looking for medical terms)
      const conditions = eventText
        .match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:syndrome|disease|disorder|condition|infection)/g) || [];

      return {
        eventDate: date,
        eventType,
        description: eventText,
        severity,
        relatedConditions: conditions,
        medications
      };
    });

    // If no events were extracted, create a default event
    if (timelineEvents.length === 0) {
      timelineEvents.push({
        eventDate: new Date().toISOString().split('T')[0],
        eventType: "Test",
        description: "Medical document processed and archived",
        severity: "Low",
        relatedConditions: [],
        medications: []
      });
    }

    // Get the file to get the hospital name
    const file = await File.findById(fileId);
    
    // Save timeline events
    await Promise.all(
      timelineEvents.map(event => 
        TimelineEvent.create({
          userId: req.user.id,
          fileId,
          hospital: file.hospital,
          ...event
        })
      )
    );

    res.json({ 
      summary: savedSummary.summary,
      fromCache: false,
      eventsExtracted: timelineEvents.length
    });
  } catch (err) {
    console.error("PDF processing error:", err.response?.data || err.message);
    console.error("Full error:", err);

    // Try to return cached summary if available
    try {
      const existingSummary = await Summary.findOne({ fileId });
      if (existingSummary) {
        return res.json({ 
          summary: existingSummary.summary, 
          fromCache: true,
          error: "Generated with errors, using cached version"
        });
      }
    } catch (cacheErr) {
      // If cache check fails, continue to error response
    }

    return res.status(500).json({ 
      msg: "Failed to process PDF content.",
      error: err.response?.data || err.message 
    });
  }
};
