import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6">
      <h1 className="text-4xl font-bold mb-10">PortfolioAI</h1>

      <div className="grid gap-8 md:grid-cols-2 w-full max-w-xl">
        <Link
          href="/upload"
          className="bg-blue-600 rounded-2xl p-8 hover:scale-105 transition"
        >
          <h2 className="text-2xl font-semibold mb-2">One-Click Portfolio</h2>
          <p className="opacity-80">
            Upload your résumé → get a hosted site in under 1 minute.
          </p>
        </Link>

        <Link
          href="/interview"
          className="bg-purple-600 rounded-2xl p-8 hover:scale-105 transition"
        >
          <h2 className="text-2xl font-semibold mb-2">Mock Interview</h2>
          <p className="opacity-80">
            Chat with an AI interviewer &amp; receive instant feedback.
          </p>
        </Link>
      </div>
    </main>
  );
}
