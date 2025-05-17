import OpenAI from "openai";

export const groq = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey : process.env.OPENAI_API_KEY,
});
