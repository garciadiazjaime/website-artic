import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import "dotenv/config";

const ai = new GoogleGenAI({});
const MODEL_NAME = "gemini-2.5-flash";
export const BASE_FOLDER = "script/art-quiz";

const s3Client = new S3Client({
  region: "us-east-1",
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

const colors = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

export function loggerInfo(...args) {
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

export async function generateProvenance(artwork) {
  const prompt = `
    the following text talks about the provenance of the work "${artwork.data.title}" by "${artwork.data.artist_title}";
    Summarize the text using up to 5 bullet points;
    On each bullet point, if there's no information about the worth or price of the artwork, supply an approximate value based on similar artworks by the same artist except for the first bullet point;
    Use only US dollars;
    Add a bullet with the approximate current price of the artwork;
    Return the result as a JSON array of strings;
    Return only the JSON array, without any additional text;
    Shoot for bullet points no longer than 120 characters each;
    Keep a casual and engaging tone;
    Provenance: ${artwork.data.provenance_text}`;

  loggerInfo("Generating provenance");
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });

  const cleanJson = response.text.replace(/^```json|```$/g, "").trim();
  const provenance = JSON.parse(cleanJson);

  return provenance;
}

export async function saveQuiz(dateString, quiz) {
  loggerInfo("Saving quiz:", dateString);

  fs.mkdirSync(BASE_FOLDER, { recursive: true });
  const filePath = `${BASE_FOLDER}/${dateString}.quiz.json`;
  const payload = JSON.stringify(quiz, null, 2);
  fs.writeFileSync(filePath, payload);
  loggerInfo("Saved quiz to:", filePath);

  return payload;
}

export async function uploadFile(Key, payload) {
  loggerInfo("Uploading file to S3:", Key);
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key,
    Body: JSON.stringify(payload),
    ContentType: "application/json",
    CacheControl: "public, max-age=31536000", // Cache for 1 year
  });

  await s3Client.send(command);
  loggerInfo(`Uploaded: ${Key}`);
}

export async function uploadImageToS3(Key, imageUrl) {
  loggerInfo("Uploading image to S3:", imageUrl);

  const response = await fetch(imageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.artic.edu/",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch image from ${imageUrl}: ${response.statusText}`
    );
  }
  const imageBuffer = await response.arrayBuffer();

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key,
    Body: imageBuffer,
    ContentType: "image/jpeg",
    CacheControl: "public, max-age=31536000", // Cache for 1 year
  });

  await s3Client.send(command);
  loggerInfo(`Uploaded image: ${Key}`);
}
