import {AppTranslate} from "./src/AppTranslate.ts";

export function add(a: number, b: number): number {
    return a + b;
}

function isLang(value: string): value is Lang {
    return ['pl', 'en', 'es'].includes(value);
}

import { config } from 'https://deno.land/x/dotenv/mod.ts';
const env = config();

import OpenAI from 'npm:openai';
const openai = new OpenAI({
    // baseURL: 'http://localhost:11434/v1',
    // apiKey: 'ollama'
    apiKey: env.OPENAI_API_KEY,
});

import { Database } from 'jsr:@db/sqlite@0.11';
const db = new Database('translations.db', { int64: true });

prepareDbSchema(db);

const appAi = new AppAI(openai, db);
const appTranslate = new AppTranslate(appAi, db);
// source: Lang, target: Lang

import { slugify } from 'https://deno.land/x/slugify/mod.ts';
import {ArticleFrontMatter} from "./src/types/ArticleFrontMatter.ts";
import {splitOnFirstOccurrence} from "./src/splitOnFirstOccurrence.ts";
import {ArticleComponent} from "./src/types/ArticleComponent.ts";
import {parseArticle} from "./src/parseArticle.ts";
import {stringifyArticle} from "./src/stringifyArticle.ts";
import {AppAI} from "./src/AppAI.ts";
import {Lang} from "./src/types/Lang.ts";
import {prepareDbSchema} from "./src/prepareDbSchema.ts";

async function translateArticleHead(
    head: ArticleFrontMatter,
    sourceLang: Lang,
    targetLang: Lang,
): Promise<ArticleFrontMatter> {
    const {
        author,
        canonicalName,
        coverImage,
        description,
        excerpt,
        publishDate,
        slug,
        tags,
        title,
        updateDate,
    } = head;

    const translatedDescription = await appTranslate.translateSentence(description, sourceLang, targetLang);
    const translatedExcerpt = await appTranslate.translateSentence(excerpt, sourceLang, targetLang);

    const [sourceLangSlug, sourceSlug] = splitOnFirstOccurrence(slug, '/');
    if (sourceLangSlug !== sourceLang) {
        throw new Error(
            `The source language does not match. Slug: ${sourceLangSlug}, Path: ${sourceSlug}`,
        );
    }
    if (!sourceSlug) throw new Error('The source slug is missing.');

    const translatedSlug = await appTranslate.translateSentence(sourceSlug, sourceLang, targetLang);
    const translatedTitle = await appTranslate.translateSentence(title, sourceLang, targetLang);

    return {
        author,
        canonicalName,
        coverImage,
        description: translatedDescription,
        excerpt: translatedExcerpt,
        publishDate,
        slug: targetLang + '/' + slugify(translatedSlug),
        tags,
        title: translatedTitle,
        updateDate,
    };
}

async function translatedArticleBody(
    body: ArticleComponent[],
    sourceLang: Lang,
    targetLang: Lang,
): Promise<ArticleComponent[]> {
    const translatedBody: ArticleComponent[] = [];

    for (const component of body) {
        if (component.type === 'text') {
            const translatedTextBlock = await appTranslate.translateSentence(
                component.content,
                sourceLang,
                targetLang,
            );
            translatedBody.push({
                type: 'text',
                content: translatedTextBlock,
            });
        } else {
            translatedBody.push(component);
        }
    }

    return translatedBody;
}

async function translateFileToLanguage(filePath: string, targetLang: Lang) {
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

        const fileContent = await Deno.readTextFile(filePath);
        const content = parseArticle<ArticleFrontMatter>(fileContent);

        const translatedHead = await translateArticleHead(
            content.head,
            sourceLang,
            targetLang,
        );

        const translatedBody = await translatedArticleBody(
            content.body,
            sourceLang,
            targetLang,
        );

        const text = stringifyArticle({
            head: translatedHead,
            body: translatedBody,
        });

        const targetPath = [
            ...pathParts.filter((_, i) => i < pathParts.length - 1),
            targetLang,
            // date + '-' + splitOnFirstOccurrence(translatedHead.slug, '/')[1] +
            date + '-' + translatedHead.canonicalName +
            '.md',
        ].join('/');

        await Deno.writeTextFile(targetPath, text);
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
    await translateFileToLanguage(filePath, targetLang);
}
