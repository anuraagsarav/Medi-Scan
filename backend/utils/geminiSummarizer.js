const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

exports.summarizeText = async (text) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: `Summarize this medical content:\n\n${text}` }] }]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const result = response.data.candidates[0].content.parts[0].text;
    return result;
  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    throw new Error("Gemini summarization failed");
  }
};
