import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import "dotenv/config";

import calendar2026 from "./data/calendar.js";
import artQuizExample from "./data/quiz_example.js";

const BASE_FOLDER = "script/days";
const ai = new GoogleGenAI({});
const s3Client = new S3Client({
  region: "us-east-1",
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

async function waitFor(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function search(item) {
  const query = {
    q: `${item.artist} ${item.iconic_work}`,
    query: {
      term: {
        is_public_domain: true,
      },
    },
  };
  console.log("query", query);
  const url = `https://api.artic.edu/api/v1/artworks/search?params=${encodeURIComponent(
    JSON.stringify(query)
  )}&limit=1`;
  console.log("Searching:", url);
  const response = await fetch(url);
  const data = await response.json();

  return data;
}

async function fetchArtwork(item) {
  const url = item.api_link;
  console.log("Fetching artwork:", url);
  const response = await fetch(url);
  const data = await response.json();

  return data;
}

async function saveArtwork(entry, artwork) {
  console.log("Saving artwork:", entry.day);
  const folderName = `${BASE_FOLDER}/${entry.day}`;
  fs.mkdirSync(folderName, { recursive: true });

  const filePath = `${folderName}/artwork.json`;
  fs.writeFileSync(filePath, JSON.stringify(artwork, null, 2));
  console.log("Saved artwork to:", filePath);
}

async function uploadFile(Key, Body) {
  console.log("Uploading file to S3:", Key);
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key,
    Body,
    ContentType: "application/json",
    CacheControl: "public, max-age=31536000", // Cache for 1 year
  });

  await s3Client.send(command);
  console.log(`Uploaded: ${Key}`);
}

async function saveQuiz(entry, artwork, questions) {
  console.log("Saving quiz:", entry.day);
  const quiz = {
    image: `https://www.artic.edu/iiif/2/${artwork.data.image_id}/full/843,/0/default.jpg`,
    quiz_title: `${entry.artist}: ${entry.iconic_work} - Art Institute of Chicago`,
    questions,
  };

  const filePath = `${BASE_FOLDER}/${entry.day}/quiz.json`;
  const payload = JSON.stringify(quiz, null, 2);
  fs.writeFileSync(filePath, payload);
  console.log("Saved quiz to:", filePath);

  return payload;
}

async function generateQuizQuestions(entry) {
  const exampleQuestions = artQuizExample.questions;

  const prompt = `Generate 7 quiz questions about the following artwork: ${
    entry.artist
  } - ${
    entry.iconic_work
  }; use the following example questions as a guide: ${JSON.stringify(
    exampleQuestions
  )}; The questions should be a mix of easy, intermediate, hard, and expert difficulty levels; each question should have 3 options labeled A, B, and C; provide the correct answer for each question; return the result as a JSON array of question objects with the following structure: { difficulty: string, question_number: number, question_text: string, options: { A: string, B: string, C: string }, correct_answer: string (A, B, or C) }; only return the JSON array without any additional text.`;

  console.log("Generating quiz questions with prompt:", prompt);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const cleanJson = response.text.replace(/^```json|```$/g, "").trim();
  const questions = JSON.parse(cleanJson);

  return questions;
}

async function main() {
  for (let entry of calendar2026.daily_art_calendar.slice(0, 1)) {
    const response = await search(entry);

    if (!response.data?.length) {
      console.log("[error] No results for", entry);
      return;
    }

    const artwork = await fetchArtwork(response.data[0]);
    if (!artwork) {
      console.log("[error] No artwork found for", entry);
      return;
    }
    if (!artwork.data.image_id) {
      console.log("[error] No image for", entry);
      return;
    }
    await saveArtwork(entry, artwork);

    const questions = await generateQuizQuestions(entry);
    if (questions?.length === 0) {
      console.log("[error] No questions generated for", entry);
      return;
    }

    const quiz = await saveQuiz(entry, artwork, questions);

    await uploadFile(`public/art-quiz/${entry.day}.json`, quiz);
  }
}

main().then(() => {
  console.log("Done");
});
