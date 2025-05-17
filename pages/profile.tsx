import useSWR from "swr";
const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function Profile() {
  const { data, error } = useSWR("/profile.json", fetcher);

  if (error) return <p className="p-8">Failed to load profile.</p>;
  if (!data)  return <p className="p-8">Loading…</p>;

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
