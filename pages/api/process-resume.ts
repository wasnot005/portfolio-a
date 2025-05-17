import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File as FormidableFile, Files as FormidableFiles } from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";
import { groq } from "../../lib/groq";
import { getTemplateHtml } from "../../lib/fetchTemplate";


export const config = { api: { bodyParser: false } }; // handle multipart

function fill(t: string, key: string, val: string) {
  return t.replaceAll(`{{${key}}}`, val || "");
}

function safe(profile: any, key: string, fallback = "") {
  return profile && profile[key] ? String(profile[key]) : fallback;
}

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
    let profile: any = {};
    try {
      const resp = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Return ONLY JSON with keys: name, title, about, skills (array), work (array of {company, role, dates, bullets}), projects (array), contact.",
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
      console.error("Error parsing Groq response or extracting JSON:", err);
      return res.status(500).json({ error: "Failed to parse Groq response" });
    }

    // 3 fill template and return HTML
    const template = await getTemplateHtml();

    let html = template;

    // Replace ALL placeholders in the template with resume/profile data
    html = fill(html, "NAME", safe(profile, "name"));
    html = fill(html, "TITLE", safe(profile, "title"));
    html = fill(html, "ABOUT", safe(profile, "about"));
    html = fill(html, "TAGLINE", safe(profile, "tagline"));
    html = fill(html, "CONTACT_EMAIL", profile?.contact?.email || "");
    html = fill(html, "RESUME_URL", profile?.resumeUrl || "");
    html = fill(html, "LINKEDIN_URL", profile?.contact?.linkedin || "");
    html = fill(html, "BEHANCE_URL", profile?.contact?.behance || "");
    html = fill(html, "GITHUB_URL", profile?.contact?.github || "");
    html = fill(html, "PROFILE_PHOTO_URL", profile?.photoUrl || "assets/img/perfil.png");
    html = fill(html, "ABOUT_IMAGE_URL", profile?.aboutImageUrl || "assets/img/about.jpg");
    html = fill(html, "SKILLS_IMAGE_URL", profile?.skillsImageUrl || "assets/img/work3.jpg");
    html = fill(html, "SKILLS_INTRO", safe(profile, "skillsIntro"));
    html = fill(
      html,
      "SKILLS",
      Array.isArray(profile.skills)
        ? profile.skills.map((s: string) => `<div class="skills__data"><div class="skills__names"><span class="skills__name">${s}</span></div></div>`).join("")
        : ""
    );
    html = fill(
      html,
      "WORK_ITEMS",
      Array.isArray(profile.work)
        ? profile.work
            .map(
              (w: any) =>
                `<div class="work__item"><h3>${w.role} @ ${w.company}</h3><em>${w.dates}</em><ul>${Array.isArray(w.bullets) ? w.bullets.map((b: string) => `<li>${b}</li>`).join("") : ""}</ul></div>`
            )
            .join("")
        : ""
    );
    html = fill(
      html,
      "PROJECTS",
      Array.isArray(profile.projects)
        ? profile.projects.map((p: string) => `<div class="work__img"><div>${p}</div></div>`).join("")
        : ""
    );
    html = fill(
      html,
      "CONTACT",
      profile.contact
        ? Object.entries(profile.contact)
            .map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`)
            .join("")
        : ""
    );
    html = fill(html, "CONTACT_FORM_ENDPOINT", "");
    html = fill(html, "CONTACT_BUTTON_LABEL", "Send");
    html = fill(html, "FACEBOOK_URL", profile?.contact?.facebook || "#");
    html = fill(html, "INSTAGRAM_URL", profile?.contact?.instagram || "#");
    html = fill(html, "TWITTER_URL", profile?.contact?.twitter || "#");
    html = fill(html, "YEAR", String(new Date().getFullYear()));

    // send back to the front-end
    return res.status(200).json({ html, profile });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Unexpected server error", details: err.message });
  }
}
