import { config } from 'https://deno.land/x/dotenv/mod.ts';
const env = config();

import { Database } from 'jsr:@db/sqlite@0.11';
import { prepareDbSchema } from './src/prepareDbSchema.ts';
import { isLang } from './src/isLang.ts';
import { FilePath } from './src/FilePath.ts';
import { parseArticle } from './src/parseArticle.ts';
import { ArticleFrontMatter } from './src/types/ArticleFrontMatter.ts';
import { Lang } from './src/types/Lang.ts';
import { ArticleComponent } from './src/types/ArticleComponent.ts';
import { TranslationDbRow } from './src/types/TranslationDbRow.ts';
import { slugify } from 'https://deno.land/x/slugify@0.3.0/mod.ts';
import { generateArticleBodySignature } from './src/generateArticleBodySignature.ts';
const db = new Database('translations.db', { int64: true });

prepareDbSchema(db);

interface TranslationSelector {
  sourceLang: Lang;
  targetLang: Lang;
  sourceText: string;
}

function getDbTranslation(
  selector: TranslationSelector,
): TranslationDbRow | undefined {
  return db.prepare(
    `SELECT * FROM translations WHERE sourceLang = :sourceLang AND targetLang = :targetLang AND sourceText = :sourceText`,
  ).get({
    sourceLang: selector.sourceLang,
    targetLang: selector.targetLang,
    sourceText: selector.sourceText,
  }) as TranslationDbRow | undefined;
}

function setDbTranslation(selector: TranslationSelector, translation: string) {
  db.prepare(
    `UPDATE translations 
     SET targetText = :targetText
     WHERE sourceLang = :sourceLang 
        AND targetLang = :targetLang 
        AND sourceText = :sourceText`,
  ).get({
    sourceLang: selector.sourceLang,
    targetLang: selector.targetLang,
    sourceText: selector.sourceText,
    targetText: translation,
  });

  console.log(
    `Translation: ${selector.sourceLang} => ${selector.targetLang} saved [${
      selector.sourceText.substring(0, 20).replaceAll('\n', '')
    } => ${
      translation.substring(0, 20).replaceAll('\n', '')
    }] (${selector.sourceText.length}/${translation.length} = ${
      selector.sourceText.length / translation.length
    })`,
  );
}

function getSourceSlugWithoutLang(head: ArticleFrontMatter, lang: Lang) {
  return slugify(head.slug.replace(new RegExp(`^${lang}/`), ''));
}

function syncArticleHead<T extends ArticleFrontMatter>(
  sourceHead: T,
  targetHead: T,
  sourceLang: Lang,
  targetLang: Lang,
) {
  for (const key of ['description', 'excerpt', 'title'] as (keyof T)[]) {
    const dbTranslation = getDbTranslation({
      sourceLang,
      targetLang,
      sourceText: String(sourceHead[key]),
    });

    if (!dbTranslation || dbTranslation.targetText !== targetHead[key]) {
      setDbTranslation({
        sourceLang,
        targetLang,
        sourceText: String(sourceHead[key]),
      }, String(targetHead[key]));
    }
  }

  const sourcePureSlug = getSourceSlugWithoutLang(sourceHead, sourceLang);
  const targetPureSlug = getSourceSlugWithoutLang(targetHead, targetLang);

  const dbSlug = getDbTranslation({
    sourceLang,
    targetLang,
    sourceText: sourcePureSlug,
  });

  if (!dbSlug || dbSlug.targetText !== targetPureSlug) {
    setDbTranslation({
      sourceLang,
      targetLang,
      sourceText: sourcePureSlug,
    }, targetPureSlug);
  }
}

function syncArticleBody(
  sourceBody: ArticleComponent[],
  targetBody: ArticleComponent[],
  sourceLang: Lang,
  targetLang: Lang,
) {
  const sourceSignature = generateArticleBodySignature(sourceBody);
  const targetSignature = generateArticleBodySignature(targetBody);

  if (sourceSignature !== targetSignature) {
    throw new Error(
      `Articles with different body signatures cannot be synced: ${sourceSignature} !== ${targetSignature}`,
    );
  }

  for (const [index, sourceComponent] of sourceBody.entries()) {
    if (sourceComponent.type === 'text') {
      const dbTranslation = getDbTranslation({
        sourceLang,
        targetLang,
        sourceText: sourceComponent.content,
      });

      if (
        !dbTranslation ||
        dbTranslation.targetText !== targetBody[index].content
      ) {
        setDbTranslation({
          sourceLang,
          targetLang,
          sourceText: sourceComponent.content,
        }, targetBody[index].content);
      }
    }
  }
}

async function syncFileWithLanguage(filePath: string, targetLang: Lang) {
  try {
    const sourceFp = new FilePath(filePath);
    const sourceLang = sourceFp.lang;
    const targetFp = Object.assign(sourceFp, { lang: targetLang });
    const sourceFileContent = await Deno.readTextFile(filePath);
    const targetFileContent = await Deno.readTextFile(targetFp.toString());

    const sourceContent = parseArticle<ArticleFrontMatter>(
      sourceFileContent,
    );
    const targetContent = parseArticle<ArticleFrontMatter>(
      targetFileContent,
    );

    console.log('s', sourceContent.head.title);
    console.log('t', targetContent.head.title);

    console.log('sl', sourceLang);
    console.log('tl', targetLang);

    syncArticleHead(
      sourceContent.head,
      targetContent.head,
      sourceLang,
      targetLang,
    );
    syncArticleBody(
      sourceContent.body,
      targetContent.body,
      sourceLang,
      targetLang,
    );
  } catch (error) {
    console.error(error);
  }
}

if (import.meta.main) {
  const [filePath, targetLang] = Deno.args;

  if (!isLang(targetLang)) {
    console.error("Invalid target language. Expected 'pl', 'en', or 'es'.");
    Deno.exit(1);
  }

  await syncFileWithLanguage(filePath, targetLang);
}
