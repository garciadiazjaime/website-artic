import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

import artQuizExample from "./data/quiz_example.js";
import artists from "./data/artists.js";
import {
  loggerInfo,
  generateProvenance,
  BASE_FOLDER,
  saveQuiz,
  uploadFile,
} from "./support.js";

const ai = new GoogleGenAI({});

// gemma-3-12b-it
const MODEL_NAME = "gemini-2.5-flash";

async function waitFor(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function saveArtwork(dateString, artwork) {
  loggerInfo("Saving artwork:", dateString);
  fs.mkdirSync(BASE_FOLDER, { recursive: true });

  const filePath = `${BASE_FOLDER}/${dateString}.artwork.json`;
  fs.writeFileSync(filePath, JSON.stringify(artwork, null, 2));
  loggerInfo("Saved artwork to:", filePath);
}

async function generateQuizQuestions(artwork) {
  const exampleQuestions = artQuizExample.questions;

  const prompt = `Generate 7 quiz questions about the following artwork: ${
    artwork.data.artist_title
  } - ${
    artwork.data.title
  }; use the following example questions as a guide: ${JSON.stringify(
    exampleQuestions
  )}; The questions should be a mix of easy, intermediate, hard, and expert difficulty levels; 
  each question should have 3 options labeled A, B, and C; 
  provide the correct answer for each question; 
  return the result as a JSON array of question objects with the following structure: { difficulty: string, question_number: number, question_text: string, options: { A: string, B: string, C: string }, correct_answer: string (A, B, or C) }; 
  only return the JSON array without any additional text;
  the questions should be only about the artwork;
  only use the artwork title on the first question, on subsequent questions don't repeat the title;
  try to keep the questions unique and not too similar to each other;
  shoot for questions no that longer than 150 characters each;
  for the two first questions, don't make them too easy;
  `;

  loggerInfo("Generating quiz questions");
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });
  const cleanJson = response.text.replace(/^```json|```$/g, "").trim();
  const questions = JSON.parse(cleanJson);

  return questions;
}

async function getArtworks(artist) {
  loggerInfo(`Fetching works by artist: ${artist}`);
  const query = {
    query: {
      bool: {
        must: [
          { term: { is_public_domain: true } },
          { term: { "artist_title.keyword": artist } },
          {
            match: {
              medium_display: { query: "Oil on canvas", fuzziness: "AUTO" },
            },
          },
          { exists: { field: "artist_title" } },
        ],
      },
    },
    sort: [{ boost_rank: { order: "desc" } }],
  };
  loggerInfo(query);
  const url = `https://api.artic.edu/api/v1/artworks/search?params=${encodeURIComponent(
    JSON.stringify(query)
  )}&limit=1`;
  loggerInfo(url);

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

async function getArtwork(artist) {
  const item = await getArtworks(artist);
  if (item.data.length === 0) {
    return null;
  }

  const artwork = await fetchArtwork(item.data[0]);
  return artwork;
}

function quizExists(dateString) {
  const filePath = `${BASE_FOLDER}/${dateString}.quiz.json`;
  return fs.existsSync(filePath);
}

const getArtistIndex = () => {
  const files = fs
    .readdirSync(BASE_FOLDER)
    .filter((file) => file.endsWith(".artwork.json"))
    .sort();

  if (files.length === 0) {
    loggerInfo("No artwork files found, starting from index 0");
    return 0;
  }

  const lastFile = files[files.length - 1];
  const content = fs.readFileSync(`${BASE_FOLDER}/${lastFile}`, "utf-8");
  const artwork = JSON.parse(content);

  const artist = artwork.data.artist_title;
  const index = artists.indexOf(artist);
  loggerInfo(
    `Last file: ${lastFile}; Artist: ${artist}; Starting from index: ${
      index + 1
    }`
  );
  return index + 1;
};

const report = {
  notFoundInArtic: [],
  noArtwork: [],
  noImage: [],
  missingData: [],
  noQuestions: [],
  insufficientQuestions: [],
  noProvenance: [],
};
function printReport(report, index) {
  loggerInfo("\n" + "=".repeat(50));
  loggerInfo("REPORT SUMMARY");
  loggerInfo("=".repeat(50));
  loggerInfo(`✅ Successful: ${index}`);

  if (report.notFoundInArtic.length) {
    loggerInfo(
      `\n${colors.red}❌ Not found in ARTIC (${report.notFoundInArtic.length}):${colors.reset}`
    );
    report.notFoundInArtic.forEach((e) =>
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
  if (report.missingData.length) {
    loggerInfo(
      `\n${colors.red}❌ Missing data (${report.missingData.length}):${colors.reset}`
    );
    report.missingData.forEach((e) =>
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

async function main() {
  let artistIndex = getArtistIndex();

  if (artistIndex >= artists.length) {
    loggerInfo("All artists have been processed.");
    return;
  }

  const firstDay = new Date();
  firstDay.setDate(firstDay.getDate() + 1);

  let index = 0;
  while (index < 10) {
    loggerInfo(`....Processing ${index}`);
    let day = new Date(firstDay);
    day.setDate(firstDay.getDate() + index);
    const dateString = day.toISOString().split("T")[0];

    if (quizExists(dateString)) {
      loggerInfo(`Quiz already exists for ${dateString}, skipping...`);
      index += 1;
      continue;
    }

    const artwork = await getArtwork(artists[artistIndex]);
    artistIndex += 1;
    if (!artwork) {
      loggerInfo(`[error] No results for ${artists[artistIndex - 1]}`);
      continue;
    }

    if (!artwork.data.image_id) {
      loggerInfo("[error] No image for", artwork.data.api_link);
      report.noImage.push(artwork.data.api_link);
      continue;
    }

    if (!artwork.data.title || !artwork.data.artist_title) {
      loggerInfo("[error] Incomplete artwork data for", artwork.data.api_link);
      report.missingData.push(artwork.data.api_link);
      continue;
    }

    const questions = await generateQuizQuestions(artwork);
    if (questions?.length === 0) {
      loggerInfo("[error] No questions generated for", artwork.data.api_link);
      report.noQuestions.push(artwork.data.api_link);
      continue;
    }

    if (questions.length < 7) {
      loggerInfo(
        "[error] Not enough questions generated for",
        artwork.data.api_link,
        questions.length
      );
      report.insufficientQuestions.push(artwork.data.api_link);
      continue;
    }

    let provenance = await generateProvenance(artwork);
    if (!Array.isArray(provenance) || !provenance.length) {
      loggerInfo("[error] No provenance generated for", artwork.data.api_link);
      report.noProvenance.push(artwork.data.api_link);
      provenance = [];
    }

    const quiz = {
      image: `https://www.artic.edu/iiif/2/${artwork.data.image_id}/full/843,/0/default.jpg`,
      quiz_title: `${artwork.data.artist_title}: ${artwork.data.title} - Art Institute of Chicago`,
      questions,
      provenance,
      mode: MODEL_NAME,
    };
    await saveArtwork(dateString, artwork);
    await saveQuiz(dateString, quiz);

    await uploadFile(`public/art-quiz/${dateString}.json`, quiz);

    index += 1;

    await waitFor();
  }

  printReport(report, index);
}

main().then(() => {
  loggerInfo("Done");
});
