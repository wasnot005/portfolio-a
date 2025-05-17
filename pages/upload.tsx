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

    const res = await fetch("/api/process-resume", { method: "POST", body });
    setBusy(false);
    res.ok ? Router.push("/profile") : alert("Error. Check console.");
  }

  return (
    <main className="prose mx-auto p-8">
      <h1>Upload your résumé</h1>
      <form encType="multipart/form-data" onSubmit={handleSubmit}>
        <input
          type="file" name="resume"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
        <button className="btn-primary ml-4" disabled={!file || busy}>
          {busy ? "Generating…" : "Generate Portfolio"}
        </button>
      </form>
    </main>
  );
}
