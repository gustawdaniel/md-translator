import { prepareDbSchema } from './src/prepareDbSchema.ts';

const sourceText = 'quicksort-implementation-in-rust-typescript-and-go';
const sourceLang = 'en';
const targetLang = 'es';

import { config } from 'https://deno.land/x/dotenv/mod.ts';
const env = config();

import OpenAI from 'npm:openai';
const openai = new OpenAI({
  // baseURL: 'http://localhost:11434/v1',
  // apiKey: 'ollama'
  apiKey: env.OPENAI_API_KEY,
});

import { Database } from 'jsr:@db/sqlite@0.11';
import { AppAI } from './src/AppAI.ts';
import { systemMessage } from './src/systemMessage.ts';
const db = new Database('translations.db');
prepareDbSchema(db);

const appAi = new AppAI(openai, db);

if (import.meta.main) {
  const aiResponse = await appAi.callOpenAI(
    sourceText,
    systemMessage(sourceLang, targetLang),
  );
  console.log(aiResponse);
  db.prepare(
    'DELETE FROM translations WHERE sourceText = ? AND sourceLang = ? AND targetLang = ?',
  ).run(sourceText, sourceLang, targetLang);
}
