const axios = require("axios");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

exports.generateDietPlan = async (req, res) => {
  const { height, weight, meals } = req.body;

  const bmi = weight / ((height / 100) ** 2);
  const bmiCategory = bmi < 18.5 ? "underweight" :
                      bmi < 25 ? "normal" :
                      bmi < 30 ? "overweight" : "obese";

  const prompt = `
    Based on a BMI of ${bmi.toFixed(2)} (${bmiCategory}), generate a simple personalized Indian diet plan.
    The user usually eats:
    - Breakfast: ${meals.breakfast}
    - Lunch: ${meals.lunch}
    - Dinner: ${meals.dinner}
    - Snacks: ${meals.snacks}

    Suggest healthy substitutions or adjustments.
  `;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const diet = response.data.candidates[0].content.parts[0].text;

    res.json({
      bmi: bmi.toFixed(2),
      category: bmiCategory,
      diet
    });
  } catch (err) {
    console.error("Gemini API Error:", err.response?.data || err.message);
    res.status(500).json({ msg: "Failed to generate diet plan" });
  }
};
