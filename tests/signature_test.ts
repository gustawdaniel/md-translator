import { assertEquals } from '@std/assert/equals';
import { generateArticleBodySignature } from '../src/generateArticleBodySignature.ts';
import { parseArticle } from '../src/parseArticle.ts';
import { ArticleFrontMatter } from '../src/types/ArticleFrontMatter.ts';

Deno.test(async function signatureTest() {
  const filePath = './tests/example/en/2024-01-01-test-article.md';

  const fileContent = await Deno.readTextFile(filePath);
  const content = parseArticle<ArticleFrontMatter>(fileContent);
  const signature = generateArticleBodySignature(content.body);

  assertEquals(signature, 'titctctctcitctc');
});
