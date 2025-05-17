import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File as FormidableFile, Files as FormidableFiles } from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";
import { groq } from "../../lib/groq";

export const config = { api: { bodyParser: false } }; // handle multipart

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

    // 1 receive the uploaded PDF
    const files = await new Promise<FormidableFiles>((resolve, reject) =>
      formidable({ maxFiles: 1 }).parse(req, (err, _fields, files) => (err ? reject(err) : resolve(files)))
    );
    console.log("DEBUG files keys:", Object.keys(files));   

    // Handle both single and array file cases
    let file: FormidableFile | undefined;
    const resumeFile = files.resume;
    if (Array.isArray(resumeFile)) {
      file = resumeFile[0];
    } else {
      file = resumeFile;
    }
    if (!file) {
      console.error("No resume file uploaded. files:", files);
      return res.status(400).json({ error: "No resume file uploaded" });
    }

    const pdfBuf = fs.readFileSync(file.filepath);
    const pdfText = (await pdfParse(pdfBuf)).text.slice(0, 15000); // trim for token cost

    // 2 ask Groq for structured JSON
    let profile = {};
    try {
      const resp = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Return ONLY JSON with keys: name, title, about, skills (array), work (array of {company, role, dates, bullets}), projects (array).",
          },
          { role: "user", content: pdfText },
        ],
      });

      const content = resp?.choices?.[0]?.message?.content;
      console.log("DEBUG Groq API raw content:", content);

      if (!content) {
        console.error("No content from Groq API. resp:", resp);
        return res.status(500).json({ error: "No content from Groq API" });
      }

      // Extract JSON from markdown code block if present
      let jsonStr = content;
      const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        jsonStr = match[1];
      }
      profile = JSON.parse(jsonStr);
    } catch (err) {
      console.error("Failed to process resume:", err);
      return res.status(500).json({ error: "Failed to process resume", details: (err as Error).message });
    }

    // 3 save so the front-end can read it instantly
    try {
      if (!fs.existsSync("public")) {
        fs.mkdirSync("public");
      }
      fs.writeFileSync("public/profile.json", JSON.stringify(profile, null, 2));
    } catch (err) {
      console.error("Failed to save profile:", err);
      return res.status(500).json({ error: "Failed to save profile", details: (err as Error).message });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error", details: (err as Error).message });
  }
}
