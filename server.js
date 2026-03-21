import process from "node:process";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const {
  OPENAI_API_KEY,
  OPENAI_PROJECT,
  OPENAI_ORGANIZATION,
  OPENAI_MODEL = "gpt-4o-mini",
} = process.env;

if (!OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is missing. OpenAI requests will fail until it is configured.");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  project: OPENAI_PROJECT,
  organization: OPENAI_ORGANIZATION,
});

function summarizeOpenAIError(err) {
  return {
    status: err?.status ?? err?.response?.status ?? null,
    code: err?.code ?? err?.error?.code ?? null,
    type: err?.type ?? err?.error?.type ?? null,
    message: err?.message ?? "Unknown OpenAI error",
    requestId: err?.request_id ?? err?.headers?.["x-request-id"] ?? null,
  };
}

// Default fallback
const DEFAULT_RESPONSE = {
  question:
    "Error processing your answer.",
  score: 5,
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
        model: OPENAI_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0]?.message?.content;
      console.log("RAW AI RESPONSE:", raw);

      if (!raw) {
        throw new Error("OpenAI response did not include any message content.");
      }

      parsed = JSON.parse(raw);
    } catch (err) {
      const details = summarizeOpenAIError(err);
      console.warn("OpenAI call failed or response invalid, using default.", details);

      if (details.status === 429) {
        console.warn(
          "OpenAI returned HTTP 429. If your account has funds, verify that this API key belongs to the funded project and set OPENAI_PROJECT (and OPENAI_ORGANIZATION if needed).",
        );
      }
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