export function add(a: number, b: number): number {
  return a + b;
}
import { config } from "https://deno.land/x/dotenv/mod.ts";

const env = config();

import OpenAI from "npm:openai";

type Lang = 'pl' | 'en' | 'es';
type FullLangName = 'polish' | 'english' | 'spanish';

function isLang(value: string): value is Lang {
  return ['pl', 'en', 'es'].includes(value);
}

function fullLangName(lang: Lang): FullLangName {
  switch (lang) {
    case 'pl':
      return 'polish';
    case 'en':
      return 'english';
    case 'es':
      return 'spanish';
  }
}


const openai = new OpenAI({
  // baseURL: 'http://localhost:11434/v1',
  // apiKey: 'ollama'
  apiKey: env.OPENAI_API_KEY
});


import { Database } from "jsr:@db/sqlite@0.11";
import { Hash, encode } from "https://deno.land/x/checksum@1.4.0/mod.ts";
import { ChatCompletionCreateParamsStreaming } from "npm:openai";

const db = new Database("translations.db");

// Create the table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS translations (
    md5 TEXT PRIMARY KEY,
    input TEXT NOT NULL,
    translatedText TEXT NOT NULL,
    finish_reason TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    request_time INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL
  );
`);

function md5(input: object): string {
  return new Hash("md5").digest(encode(JSON.stringify(input))).hex();
}

async function callOpenAI(input: string, source: Lang, target: Lang) {
  const model = "gpt-4o-mini";
  // model: "llama3.2:1b",

  const requestPayload: ChatCompletionCreateParamsStreaming = {
    model,
    messages: [
      { role: "system", content: `You are a translator for both human and programming languages. Deliver the translation from ${fullLangName(source)} to ${fullLangName(target)} of the given text. Do not comment or explain. I need only the translation.` },
      { role: "user", content: input },
    ],
  };

  const inputHash = md5(requestPayload);

  const existingResponse = db.prepare("SELECT * FROM translations WHERE md5 = :md5").get({md5: inputHash});

  if(existingResponse) {
    console.log("Using cached response.");
    return existingResponse;
  }

  const requestTime = Date.now();

  const response = await openai.chat.completions.create(requestPayload);

  const responseTime = Date.now();

  const {
    choices,
    usage,
  } = response;

  const translatedText = choices[0]?.message?.content || "";

  const dbResponse = db.prepare(
      "INSERT INTO translations (md5, input, translatedText, finish_reason, prompt_tokens, completion_tokens, total_tokens, request_time, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
  ).get([inputHash, JSON.stringify(requestPayload), translatedText, choices[0].finish_reason, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0, usage?.total_tokens ?? 0, requestTime, responseTime-requestTime]);

  if(!dbResponse) {
    throw new Error('Failed to insert the response into the database.');
  }

  return dbResponse;
}

async function translate(filePath: string, targetLang: Lang) {
  // Split the path into parts
  const pathParts = filePath.split('/');

  // Extract the source language (the part right before the filename)
  const sourceLang = [pathParts[pathParts.length - 2]].filter(isLang)[0];

  // Extract the file name (last part of the path)
  const fileName = pathParts.pop() ?? '';

  // Decompose the file name using a regular expression
  const match = fileName.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);

  if (match) {
    const date = match[1]; // "2021-02-26"
    const slug = match[2]; // "difference-between-json-files"

    console.log("Date:", date);
    console.log("Slug:", slug);
    console.log("Source Lang:", sourceLang);
    console.log("Target Lang:", targetLang);

    const response = await callOpenAI('I am learning Deno and I am trying to understand how to use the fs module to read and write files. Can you help me with that?', sourceLang, 'pl');

    console.log(response);
  } else {
    console.error("The file name does not match the expected pattern.");
  }
}


// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const [filePath, targetLang] = Deno.args;

  if(!isLang(targetLang)) {
    console.error("Invalid target language. Expected 'pl', 'en', or 'es'.");
    Deno.exit(1);
  }
  await translate(filePath, targetLang)
}

