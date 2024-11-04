export function add(a: number, b: number): number {
  return a + b;
}
import { config } from 'https://deno.land/x/dotenv/mod.ts';

const env = config();

import OpenAI from 'npm:openai';

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
  apiKey: env.OPENAI_API_KEY,
});

import { Database } from 'jsr:@db/sqlite@0.11';
import { encode, Hash } from 'https://deno.land/x/checksum@1.4.0/mod.ts';
import { ChatCompletionCreateParamsStreaming } from 'npm:openai';

// https://deno.land/x/sqlite3@0.11.1/mod.ts?s=Database
const db = new Database('translations.db', { int64: true });

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

// finish_reason (https://platform.openai.com/docs/api-reference/chat/object)
//
// The reason the model stopped generating tokens. This will be stop if the model hit a natural stop point or a provided stop sequence, length if the maximum number of tokens specified in the request was reached, content_filter if content was omitted due to a flag from our content filters, tool_calls if the model called a tool, or function_call (deprecated) if the model called a function.

interface TranslationDbRow {
  md5: string; //"291d6163322db588d1ffd156fd70dc69",
  input: string; //'{"model":"gpt-4o-mini","messages":[{"role":"system","content":"You are a translator of technical blog written in markdown. Deliver the translation from english to polish of the given text. Do not comment or explain. I need only the translation."},{"role":"user","content":"calculating-the-difference-between-json-files"}]}',
  translatedText: string; //"obliczanie-różnicy-między-plikami-json",
  finish_reason:
    | 'stop'
    | 'length'
    | 'content_filter'
    | 'tool_calls'
    | 'function_call';
  prompt_tokens: bigint; //54n;
  completion_tokens: bigint; //13n;
  total_tokens: bigint; //67n;
  request_time: bigint; //1730665057022n;
  duration_ms: bigint; //1125n;
}

function md5(input: object): string {
  return new Hash('md5').digest(encode(JSON.stringify(input))).hex();
}

// source: Lang, target: Lang

function systemMessage(source: Lang, target: Lang, extra?: string): string {
  return `You are a translator of technical blog written in markdown. Deliver the translation from ${
    fullLangName(source)
  } to ${
    fullLangName(target)
  } of the given text. Do not comment or explain. I need only the translation.` +
    (extra ? ` ${extra}` : '');
}

async function callOpenAI(
  user: string,
  system: string,
): Promise<TranslationDbRow> {
  const model = 'gpt-4o-mini';
  // model: "llama3.2:1b",

  const requestPayload: ChatCompletionCreateParamsStreaming = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };

  const inputHash = md5(requestPayload);

  const existingResponse = db.prepare(
    'SELECT * FROM translations WHERE md5 = :md5',
  ).get({ md5: inputHash }) as TranslationDbRow | undefined;

  if (existingResponse) {
    console.log('Using cached response.');
    return existingResponse;
  }

  const requestTime = Date.now();

  console.log('requestTime', requestTime);

  const response = await openai.chat.completions.create(requestPayload);

  const responseTime = Date.now();

  const {
    choices,
    usage,
  } = response;

  const translatedText = choices[0]?.message?.content || '';

  const dbResponse = db.prepare(
    'INSERT INTO translations (md5, input, translatedText, finish_reason, prompt_tokens, completion_tokens, total_tokens, request_time, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *',
  ).get([
    inputHash,
    JSON.stringify(requestPayload),
    translatedText,
    choices[0].finish_reason,
    usage?.prompt_tokens ?? 0,
    usage?.completion_tokens ?? 0,
    usage?.total_tokens ?? 0,
    BigInt(requestTime),
    responseTime - requestTime,
  ]) as TranslationDbRow | undefined;

  if (!dbResponse) {
    throw new Error('Failed to insert the response into the database.');
  }

  return dbResponse;
}

// import fm from 'npm:front-matter';

interface ArticleComponent {
  type: 'text' | 'code';
  content: string;
}

interface Article<T> {
  head: T;
  body: ArticleComponent[];
}

interface ArticleFrontMatter {
  author: string; //"Daniel Gustaw",
  canonicalName: string; //"calculating-the-difference-between-json-files",
  coverImage: string; //"http://localhost:8484/7f52c42e-103b-4ef9-b689-d08807ad2f7f.avif",
  date_updated: string; //2023-10-12T00:00:00.000Z,
  description: string; //"Learn how to find missing translations in JSON files with dictionaries.",
  excerpt: string; //"Learn how to find missing translations in JSON files with dictionaries.",
  publishDate: string; //2021-02-26T00:00:00.000Z,
  slug: string; //"en/calculating-the-difference-between-json-files",
  tags: string[]; //[ "i18next" ],
  title: string; // "Calculating the Difference Between JSON Files"
}

function splitOnFirstOccurrence(
  str: string,
  delimiter: string,
): [string] | [string, string] {
  const index = str.indexOf(delimiter);
  if (index === -1) return [str]; // If delimiter is not found, return the whole string
  return [str.substring(0, index), str.substring(index + delimiter.length)];
}

function parseArticle<T>(
  content: string,
): Article<T> {
  const parts = content.split('\n---\n');
  const headContent = parts[0].replace('---\n', '');

  const head: Record<string, unknown> = {};
  let currentHeadKey: string | null = null;

  for (const line of headContent.split('\n')) {
    const [key, value] = splitOnFirstOccurrence(line, ':').map((s) => s.trim());
    if (key && value) {
      head[key] = value;
    } else if (key && typeof value === 'string') {
      currentHeadKey = key;
    } else if (key && key.startsWith('-') && !value) {
      if (currentHeadKey) {
        if (!head[currentHeadKey]) {
          head[currentHeadKey] = [];
        }
        (head[currentHeadKey] as string[]).push(
          key.replace('-', '').trim(),
        );
      }
    }
  }

  const bodyContent = parts.slice(1).join('\n---\n');

  const components: ArticleComponent[] = [];

  let currentComponent: ArticleComponent = {
    type: 'text',
    content: '',
  };

  for (const line of bodyContent.split('\n')) {
    if (line.startsWith('```')) {
      if (currentComponent.type === 'code') {
        currentComponent.content += line + '\n';
      }

      components.push(currentComponent);
      currentComponent = {
        type: currentComponent.type === 'text' ? 'code' : 'text',
        content: currentComponent.type === 'text' ? line + '\n' : '',
      };
    } else {
      currentComponent.content += line + '\n';
    }
  }

  components.push(currentComponent);

  return {
    head: head as T,
    body: components,
  };
}

import { slugify } from 'https://deno.land/x/slugify/mod.ts';

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

    console.log('Date:', date);
    console.log('Slug:', slug);
    console.log('Source Lang:', sourceLang);
    console.log('Target Lang:', targetLang);

    const fileContent = await Deno.readTextFile(filePath);
    const content = parseArticle<ArticleFrontMatter>(fileContent);

    console.log(content.head);

    const response = await callOpenAI(
      'calculating-the-difference-between-json-files',
      systemMessage(sourceLang, 'pl'),
    );
    console.log(response);

    console.log('Translated Text:', slugify(response.translatedText));
  } else {
    console.error('The file name does not match the expected pattern.');
  }
}
// 1730663698654
// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const [filePath, targetLang] = Deno.args;

  if (!isLang(targetLang)) {
    console.error("Invalid target language. Expected 'pl', 'en', or 'es'.");
    Deno.exit(1);
  }
  await translate(filePath, targetLang);
}
