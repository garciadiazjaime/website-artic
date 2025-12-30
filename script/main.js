import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import "dotenv/config";

import calendar2026 from "./data/calendar.js";
import artQuizExample from "./data/quiz_example.js";

const BASE_FOLDER = "script/art-quiz";
const ai = new GoogleGenAI({});
const s3Client = new S3Client({
  region: "us-east-1",
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

async function waitFor(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const colors = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function loggerInfo(...args) {
  const timestamp = `${colors.gray}${new Date().toISOString()}${colors.reset}`;
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
    .join(" ");

  if (message.includes("[error]")) {
    console.log(timestamp, colors.red + message + colors.reset);
  } else if (message.includes("Uploaded") || message.includes("Saved")) {
    console.log(timestamp, colors.green + message + colors.reset);
  } else if (message.includes("warn")) {
    console.log(timestamp, colors.yellow + message + colors.reset);
  } else {
    console.log(timestamp, colors.cyan + message + colors.reset);
  }
}

async function searchArtic(item) {
  const query = {
    query: {
      bool: {
        must: [
          { match: { title: { query: item.iconic_work, fuzziness: "AUTO" } } },
          {
            match: { artist_title: { query: item.artist, fuzziness: "AUTO" } },
          },
        ],
      },
    },
  };
  loggerInfo("query", query);
  const url = `https://api.artic.edu/api/v1/artworks/search?params=${encodeURIComponent(
    JSON.stringify(query)
  )}&limit=1`;
  loggerInfo("Searching:", url);
  const response = await fetch(url);
  const data = await response.json();

  return data;
}

async function fetchArtwork(item) {
  const url = item.api_link;
  loggerInfo("Fetching artwork:", url);
  const response = await fetch(url);
  const data = await response.json();

  return data;
}

async function saveArtwork(entry, artwork) {
  loggerInfo("Saving artwork:", entry.day);
  fs.mkdirSync(BASE_FOLDER, { recursive: true });

  const filePath = `${BASE_FOLDER}/${entry.day}.artwork.json`;
  fs.writeFileSync(filePath, JSON.stringify(artwork, null, 2));
  loggerInfo("Saved artwork to:", filePath);
}

async function uploadFile(Key, Body) {
  loggerInfo("Uploading file to S3:", Key);
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key,
    Body,
    ContentType: "application/json",
    CacheControl: "public, max-age=31536000", // Cache for 1 year
  });

  await s3Client.send(command);
  loggerInfo(`Uploaded: ${Key}`);
}

async function saveQuiz(entry, artwork, questions) {
  loggerInfo("Saving quiz:", entry.day);
  const quiz = {
    image: `https://www.artic.edu/iiif/2/${artwork.data.image_id}/full/843,/0/default.jpg`,
    alternate_image: "",
    quiz_title: `${entry.artist}: ${entry.iconic_work} - Art Institute of Chicago`,
    questions,
  };

  const filePath = `${BASE_FOLDER}/${entry.day}.quiz.json`;
  const payload = JSON.stringify(quiz, null, 2);
  fs.writeFileSync(filePath, payload);
  loggerInfo("Saved quiz to:", filePath);

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

  loggerInfo("Generating quiz questions", entry);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const cleanJson = response.text.replace(/^```json|```$/g, "").trim();
  const questions = JSON.parse(cleanJson);

  return questions;
}

function quizExists(entry) {
  const filePath = `${BASE_FOLDER}/${entry.day}.quiz.json`;
  return fs.existsSync(filePath);
}

const report = {
  notFoundInArtic: [],
  notPublicDomain: [],
  noArtwork: [],
  noImage: [],
  noQuestions: [],
  insufficientQuestions: [],
};
async function main() {
  for (let entry of calendar2026.daily_art_calendar.slice(0, 2)) {
    loggerInfo(entry.day, "-", entry.artist, "-", entry.iconic_work);

    if (quizExists(entry)) {
      loggerInfo("[skip] Quiz already exists for", entry.day);
      continue;
    }

    const response = await searchArtic(entry);

    if (!response.data?.length) {
      loggerInfo("[error] No results for", entry);
      report.notFoundInArtic.push(entry);
      continue;
    }

    const artwork = await fetchArtwork(response.data[0]);
    if (!artwork) {
      loggerInfo("[error] No artwork found for", entry);
      report.noArtwork.push(entry);
      continue;
    }
    if (!artwork.data.is_public_domain) {
      loggerInfo("[warn] Not public domain:", entry);
      report.notPublicDomain.push(entry);
    }
    if (!artwork.data.image_id) {
      loggerInfo("[error] No image for", entry);
      report.noImage.push(entry);
    }
    await saveArtwork(entry, artwork);

    const questions = await generateQuizQuestions(entry);
    if (questions?.length === 0) {
      loggerInfo("[error] No questions generated for", entry);
      report.noQuestions.push(entry);
      continue;
    }

    if (questions.length < 7) {
      loggerInfo(
        "[error] Not enough questions generated for",
        entry,
        questions.length
      );
      report.insufficientQuestions.push(entry);
      continue;
    }

    const quiz = await saveQuiz(entry, artwork, questions);

    await uploadFile(`public/art-quiz/${entry.day}.json`, quiz);

    await waitFor();
  }

  loggerInfo("\n" + "=".repeat(50));
  loggerInfo("REPORT SUMMARY");
  loggerInfo("=".repeat(50));
  loggerInfo(`Total processed: ${calendar2026.daily_art_calendar.length}`);
  loggerInfo(
    `✅ Successful: ${
      calendar2026.daily_art_calendar.length -
      (report.notFoundInArtic.length +
        report.notPublicDomain.length +
        report.noArtwork.length +
        report.noImage.length +
        report.noQuestions.length +
        report.insufficientQuestions.length)
    }`
  );

  if (report.notFoundInArtic.length) {
    loggerInfo(
      `\n${colors.red}❌ Not found in ARTIC (${report.notFoundInArtic.length}):${colors.reset}`
    );
    report.notFoundInArtic.forEach((e) =>
      loggerInfo(`   - ${e.day}: ${e.artist} - ${e.iconic_work}`)
    );
  }

  if (report.notPublicDomain.length) {
    loggerInfo(
      `\n${colors.yellow}⚠️  Not public domain (${report.notPublicDomain.length}):${colors.reset}`
    );
    report.notPublicDomain.forEach((e) =>
      loggerInfo(`   - ${e.day}: ${e.artist} - ${e.iconic_work}`)
    );
  }

  if (report.noArtwork.length) {
    loggerInfo(
      `\n${colors.red}❌ No artwork (${report.noArtwork.length}):${colors.reset}`
    );
    report.noArtwork.forEach((e) =>
      loggerInfo(`   - ${e.day}: ${e.artist} - ${e.iconic_work}`)
    );
  }

  if (report.noImage.length) {
    loggerInfo(
      `\n${colors.red}❌ No image (${report.noImage.length}):${colors.reset}`
    );
    report.noImage.forEach((e) =>
      loggerInfo(`   - ${e.day}: ${e.artist} - ${e.iconic_work}`)
    );
  }

  if (report.noQuestions.length) {
    loggerInfo(
      `\n${colors.red}❌ No questions generated (${report.noQuestions.length}):${colors.reset}`
    );
    report.noQuestions.forEach((e) =>
      loggerInfo(`   - ${e.day}: ${e.artist} - ${e.iconic_work}`)
    );
  }

  if (report.insufficientQuestions.length) {
    loggerInfo(
      `\n${colors.yellow}⚠️  Insufficient questions (${report.insufficientQuestions.length}):${colors.reset}`
    );
    report.insufficientQuestions.forEach((e) =>
      loggerInfo(`   - ${e.day}: ${e.artist} - ${e.iconic_work}`)
    );
  }

  loggerInfo("=".repeat(50) + "\n");
}

main().then(() => {
  loggerInfo("Done");
});
