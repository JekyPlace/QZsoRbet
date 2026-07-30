import "dotenv/config";

import readline from "node:readline/promises";
import assert from "node:assert/strict";
import test from "node:test";
import { searchRelevantCsvContext } from "./qdrant.brain.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

test("Search input text score", async () => {
  try {
    const input = (await rl.question("Enter text to search for:\n")).trim();
    rl.close();

    rl.on("close", () => {
      console.log("Readline chiuso");
    });

    if (!input || input.length === 0) throw new Error("Input cannot be empty");

    const results = await searchRelevantCsvContext(input);

    console.log(`Text input: ${input}\n`);

    const scores = results.map((doc, index) => {
      return {
        fileName: doc.fileName,
        score: doc.score.toFixed(4),
        text: doc.text,
      };
    });

    console.log(scores);
    assert.ok(scores.length > 0, "Found at least one result");
  } catch (err) {
    console.error(err);
  }
});
