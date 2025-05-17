import { useEffect, useState } from "react";

export default function Profile() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("profile");
    console.log("DEBUG: Loaded profile from localStorage:", stored);
    if (stored) setData(JSON.parse(stored));
  }, []);

  if (!data) {
    console.log("DEBUG: No profile data found.");
    return <p className="p-8">No profile found. Please upload your résumé first.</p>;
  }

  console.log("DEBUG: Rendering profile data:", data);

  return (
    <main className="prose mx-auto p-8">
      <h1>{data.name}</h1>
      <h3>{data.title}</h3>
      <p>{data.about}</p>

      <h2>Skills</h2>
      <ul>{data.skills?.map((s: string) => <li key={s}>{s}</li>)}</ul>

      <h2>Work Experience</h2>
      {data.work?.map((w: any, i: number) => (
        <section key={i}>
          <h3>{w.role} @ {w.company}</h3>
          <em>{w.dates}</em>
          <ul>{w.bullets?.map((b: string, j: number) => <li key={j}>{b}</li>)}</ul>
        </section>
      ))}

      <h2>Projects</h2>
      <ul>{data.projects?.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
    </main>
  );
}
