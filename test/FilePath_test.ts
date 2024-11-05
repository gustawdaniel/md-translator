import { assertEquals } from '@std/assert/equals';
import { FilePath } from '../src/FilePath.ts';

Deno.test(function filePathTest() {
  const filePath = '../blog/src/content/blog/en/2021-04-21-fetch-promise.md';
  const fp = new FilePath(filePath);
  assertEquals(fp.lang, 'en');
  assertEquals(fp.basePath, '../blog/src/content/blog');
  assertEquals(fp.date, '2021-04-21');
  assertEquals(fp.canonicalName, 'fetch-promise');
});

Deno.test(function filePathAssignTest() {
  const filePath = '../blog/src/content/blog/en/2021-04-21-fetch-promise.md';
  const fp = new FilePath(filePath);
  Object.assign(fp, { lang: 'es' });
  assertEquals(
    fp.toString(),
    '../blog/src/content/blog/es/2021-04-21-fetch-promise.md',
  );
});
