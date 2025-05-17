import { useState } from "react";
import Router from "next/router";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setBusy(true);
    const body = new FormData();
    body.append("resume", file);

    console.log("DEBUG: Uploading file", file);
    const res = await fetch("/api/process-resume", { method: "POST", body });
    let html = "";
    let profile = null;
    try {
      const json = await res.json();
      html = json.html;
      profile = json.profile;
      console.log("DEBUG: Received response from /api/process-resume", json);
    } catch (err) {
      console.error("DEBUG: Error parsing response JSON", err);
    }
    setBusy(false);

    if (res.ok && html) {
      localStorage.setItem("siteHtml", html);
      if (profile) {
        localStorage.setItem("profile", JSON.stringify(profile));
      }
      console.log("DEBUG: Saved HTML and profile to localStorage, redirecting to /site");
      Router.push("/site");
    } else {
      alert("Error: portfolio not generated");
      console.error("DEBUG: Error - portfolio not generated. res.ok:", res.ok, "html:", html);
    }
  }

  return (
    <main className="prose mx-auto p-8">
      <h1>Upload your résumé</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            console.log("DEBUG: File selected", e.target.files?.[0]);
          }}
          required
        />
        <button className="btn-primary ml-4" disabled={!file || busy}>
          {busy ? "Generating…" : "Generate Portfolio"}
        </button>
      </form>
    </main>
  );
}
