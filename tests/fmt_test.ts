import { assertEquals } from '@std/assert/equals';
import { md5 } from '../src/md5.ts';
import { parseArticle } from '../src/parseArticle.ts';
import { ArticleFrontMatter } from '../src/types/ArticleFrontMatter.ts';
import { stringifyArticle } from '../src/stringifyArticle.ts';

Deno.test(async function formatTest() {
  const filePath = './tests/example/en/2024-01-01-test-article.md';

  const fileContent = await Deno.readTextFile(filePath);
  const content = parseArticle<ArticleFrontMatter>(fileContent);

  assertEquals(content.body.filter((c) => c.type === 'img').length, 2);
  const text = stringifyArticle(content);

  assertEquals(text, fileContent);
  assertEquals(md5(text), md5(fileContent));
});
