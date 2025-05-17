import type { NextApiRequest, NextApiResponse } from "next";
import { groq } from "../../lib/groq";

// Remove the edge runtime config
// export const config = { runtime: "edge" };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  // remove ids, keep only role + content
  const { messages = [] } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const clean = messages.map((m: any) => ({ role: m.role, content: m.content }));

  try {
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are a friendly interviewer for a junior software-engineering role. Ask one question at a time. After the candidate answers, reply with constructive feedback and a score out of 10. Keep it supportive.",
        },
        ...clean,
      ],
    });

    const contentRaw = completion.choices[0].message.content ?? "";
    console.log("DEBUG: Raw Groq content:", contentRaw);

    let content = contentRaw;
    try {
      if (
        typeof contentRaw === "string" &&
        contentRaw.trim().startsWith("{") &&
        contentRaw.trim().endsWith("}")
      ) {
        const parsed = JSON.parse(contentRaw);
        if (parsed && typeof parsed.content === "string") {
          content = parsed.content;
          console.log("DEBUG: Parsed Groq content field:", content);
        }
      }
    } catch (e) {
      console.error("DEBUG: Error parsing Groq content as JSON:", e);
      content = contentRaw;
    }

    console.log("DEBUG: Final content sent to client:", content);
    return res.status(200).json({ content });   // <-- plain JSON
  } catch (err: any) {
    console.error("Groq error:", err);
    return res.status(500).json({ error: err.message });
  }
}
