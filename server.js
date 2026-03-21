import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default fallback
const DEFAULT_RESPONSE = {
  question:
    "You mentioned your background — could you describe a specific project where you applied these skills?",
  score: 7,
  comment: "Clear but lacking details.",
  suggestion: "Add one concrete example.",
};

app.post("/api/response", async (req, res) => {
  console.log("Request received:", req.body);

  const { message, history = [] } = req.body;

  try {
    const prompt = `
You are an AI interview coach for software engineering roles.

Your task:
- Ask ONE specific follow-up question
- Evaluate the candidate's answer

Return this JSON ONLY:
{
  "question": "text",
  "score": number (0-10),
  "comment": "short feedback",
  "suggestion": "improvement tip"
}

Conversation:
${history.map((h) => `${h.role}: ${h.text}`).join("\n")}

Candidate answer: "${message}"
`;

    let parsed = DEFAULT_RESPONSE;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const raw = response.choices[0].message.content;
      console.log("RAW AI RESPONSE:", raw);

      parsed = JSON.parse(raw);
    } catch (err) {
      console.warn("OpenAI call failed or response invalid, using default.", err.message);
      // Parsed stays as DEFAULT_RESPONSE
    }

    res.json({
      aiMessage: { role: "ai", text: parsed.question },
      feedback: {
        score: parsed.score,
        comment: parsed.comment,
        suggestion: parsed.suggestion,
      },
    });
  } catch (err) {
    console.error("SERVER ERROR: ", err);
    // Fallback to default in case of unexpected server errors
    res.json({
      aiMessage: { role: "ai", text: DEFAULT_RESPONSE.question },
      feedback: {
        score: DEFAULT_RESPONSE.score,
        comment: DEFAULT_RESPONSE.comment,
        suggestion: DEFAULT_RESPONSE.suggestion,
      },
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});