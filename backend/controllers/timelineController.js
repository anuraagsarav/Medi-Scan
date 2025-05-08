const mongoose = require('mongoose');
const TimelineEvent = require('../models/timelineModel');
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

exports.extractTimelineEvents = async (req, res) => {
  const { fileId, fileUrl, hospital, textContent } = req.body;
  const userId = req.user.id;

  try {
    // Use Gemini to extract medical events
    const prompt = `Extract medical events from this text in JSON format. For each event include:
    - eventDate (in YYYY-MM-DD format)
    - eventType (one of: Diagnosis, Treatment, Medication, Test, Surgery, Follow-up)
    - description (brief description of the event)
    - severity (one of: Low, Medium, High, Critical)
    - relatedConditions (array of related medical conditions)
    - medications (array of objects with name, dosage, and frequency)

    Text content:
    ${textContent}`;

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const extractedEvents = JSON.parse(geminiResponse.data.candidates[0].content.parts[0].text);

    // Save each event to the timeline
    const timelineEvents = await Promise.all(
      extractedEvents.map(event => 
        TimelineEvent.create({
          userId,
          fileId,
          hospital,
          ...event
        })
      )
    );

    res.json({ events: timelineEvents });
  } catch (err) {
    console.error('Timeline extraction error:', err);
    res.status(500).json({ msg: 'Failed to extract timeline events' });
  }
};

exports.getTimeline = async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, eventType, severity, hospital } = req.query;

  try {
    let query = { userId };
    console.log('Request query parameters:', req.query);
    console.log('Fetching timeline for user:', userId);

    // Add date range filter if provided
    if (startDate && endDate) {
      query.eventDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Add event type filter if provided
    if (eventType && eventType !== 'All Types') {
      console.log('Adding event type filter:', eventType);
      query.eventType = eventType;
    }

    // Add severity filter if provided
    if (severity && severity !== 'All Severities') {
      console.log('Adding severity filter:', severity);
      query.severity = severity;
    }

    // Add hospital filter if provided
    if (hospital && hospital !== 'All Hospitals') {
      console.log('Adding hospital filter:', hospital);
      // Case-insensitive exact match
      query.hospital = new RegExp(`^${hospital}$`, 'i');
    }

    console.log('Final query:', JSON.stringify(query));
    const events = await TimelineEvent.find(query)
      .sort({ eventDate: -1 })
      .populate('fileId', 'originalName fileUrl');
    
    console.log('Found events:', events.length);
    if (events.length > 0) {
      console.log('Sample events:');
      events.slice(0, 3).forEach(event => {
        console.log(`- Hospital: ${event.hospital}, Type: ${event.eventType}, Date: ${event.eventDate}`);
      });
    }

    // Group events by year and month
    const groupedEvents = events.reduce((acc, event) => {
      const year = event.eventDate.getFullYear();
      const month = event.eventDate.getMonth();
      
      if (!acc[year]) acc[year] = {};
      if (!acc[year][month]) acc[year][month] = [];
      
      acc[year][month].push(event);
      return acc;
    }, {});

    console.log('Grouped events by year/month:', Object.keys(groupedEvents).length, 'years');

    // Send the response with the timeline data
    res.json({ timeline: groupedEvents });
  
  } catch (err) {
    console.error('Timeline fetch error:', err);
    res.status(500).json({ msg: 'Failed to fetch timeline' });
  }
};

exports.getTimelineStats = async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, eventType, severity, hospital } = req.query;

  try {
    let matchQuery = { userId: new mongoose.Types.ObjectId(userId) };

    // Add date range filter if provided
    if (startDate && endDate) {
      matchQuery.eventDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Add event type filter if provided
    if (eventType && eventType !== 'All Types') {
      matchQuery.eventType = eventType;
    }

    // Add severity filter if provided
    if (severity && severity !== 'All Severities') {
      matchQuery.severity = severity;
    }

    // Add hospital filter if provided
    if (hospital && hospital !== 'All Hospitals') {
      matchQuery.hospital = hospital;
    }

    const stats = await TimelineEvent.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            eventType: '$eventType',
            severity: '$severity'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const medications = await TimelineEvent.aggregate([
      { $match: matchQuery },
      { $unwind: '$medications' },
      {
        $group: {
          _id: '$medications.name',
          occurrences: { $sum: 1 },
          lastPrescribed: { $max: '$eventDate' }
        }
      }
    ]);

    res.json({ stats, medications });
  } catch (err) {
    console.error('Timeline stats error:', err);
    res.status(500).json({ msg: 'Failed to fetch timeline statistics' });
  }
}; 