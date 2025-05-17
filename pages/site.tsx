import { useEffect, useState } from "react";

export default function Site() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    // Try to get the latest HTML from localStorage (generated from resume)
    const siteHtml = localStorage.getItem("siteHtml");
    if (siteHtml) {
      setHtml(siteHtml);
      console.log("DEBUG: Loaded siteHtml from localStorage");
    } else {
      // Optionally, try to regenerate from profile if available
      const profile = localStorage.getItem("profile");
      if (profile) {
        // You could trigger a backend call here to regenerate HTML from profile if needed
        console.log("DEBUG: No siteHtml found, but profile exists in localStorage");
      } else {
        console.log("DEBUG: No siteHtml or profile found in localStorage");
      }
      setHtml("");
    }
  }, []);

  if (!html) return <p className="p-8">Generate your portfolio first.</p>;

  return (
    <div
      className="w-full min-h-screen border-4 border-red-600"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

