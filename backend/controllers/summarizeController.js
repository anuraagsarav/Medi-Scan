const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

exports.summarizeFile = async (req, res) => {
  try {
    const { textContent } = req.body;

    if (!textContent) {
      return res.status(400).json({ msg: "No content provided" });
    }

    const prompt = `Summarize the following medical content in simple language:\n\n${textContent}`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const summary = response.data.candidates[0].content.parts[0].text;
    res.json({ summary });
  } catch (err) {
    console.error("Gemini summarization error:", err.response?.data || err.message);
    res.status(500).json({ msg: "Failed to summarize file" });
  }
};
