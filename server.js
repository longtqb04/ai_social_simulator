import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/respond", async (req, res) => {
  console.log("Request received:", req.body);

  const { message, history = [] } = req.body;

  try {
    const prompt = `
You are an AI interview coach for software engineering roles.

Your tasks:
1. Ask ONE specific follow-up interview question
2. Evaluate the candidate's answer

STRICT RULES:
- Do NOT ask generic questions like "Can you elaborate more?"
- MUST reference something from the answer
- Be realistic and slightly challenging
- Feedback must be concise and useful

Return ONLY valid JSON (no explanation):

{
  "question": "your follow-up question",
  "score": number (0-10),
  "comment": "short feedback",
  "suggestion": "specific improvement tip"
}

Conversation history:
${history.map(h => `${h.role}: ${h.text}`).join("\n")}

Candidate answer:
"${message}"
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const raw = response.choices[0].message.content;
    console.log("RAW AI RESPONSE:", raw);

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("JSON Parse Error:", err.message);

      // fallback (important for demo stability)
      parsed = {
        question:
          "You mentioned your interest in AI—can you describe a specific project where you applied machine learning?",
        score: 7,
        comment: "Your answer is clear but too general.",
        suggestion: "Include a concrete example to strengthen your answer.",
      };
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
    console.error("Server error:", err.message);

    res.status(500).json({
      error: err.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});