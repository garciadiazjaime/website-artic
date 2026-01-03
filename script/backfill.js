import fs from "fs";

import {
  loggerInfo,
  generateProvenance,
  BASE_FOLDER,
  saveQuiz,
  uploadFile,
} from "./support.js";

async function main() {
  const today = new Date().toISOString().split("T")[0];
  loggerInfo(`Today's date: ${today}`);

  const files = fs
    .readdirSync(BASE_FOLDER)
    .filter(
      (file) => file.split(".")[0] >= today && file.endsWith(".artwork.json")
    )
    .sort();

  loggerInfo(`Found ${files.length} artwork files`);

  for (const file of files.slice(0, 20)) {
    loggerInfo(`Processing file: ${file}`);

    const artwork = JSON.parse(
      fs.readFileSync(`${BASE_FOLDER}/${file}`, "utf-8")
    );

    if (!artwork.data.provenance_text) {
      loggerInfo(`file ${file} has no provenance_text`);
    }

    let provenance = await generateProvenance(artwork);
    if (!Array.isArray(provenance) || !provenance.length) {
      loggerInfo("[error] No provenance generated for", artwork.data.api_link);
      provenance = [];
    }

    const preQuiz = JSON.parse(
      fs.readFileSync(
        `${BASE_FOLDER}/${file.replace(".artwork.json", ".quiz.json")}`,
        "utf-8"
      )
    );
    const quiz = {
      ...preQuiz,
      provenance,
    };
    const dateString = file.split(".")[0];
    await saveQuiz(dateString, quiz);
    await uploadFile(`public/art-quiz/${dateString}.json`, quiz);
  }
}

main().then(() => {
  loggerInfo("done");
});
