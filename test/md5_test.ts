import { assertEquals } from '@std/assert/equals';
import { md5 } from '../src/md5.ts';

// echo -n '{"value":"ok"}' | md5sum
Deno.test(function md5sumTest() {
  assertEquals(md5({ 'value': 'ok' }), '6f62cc3711dbd14d5c8d577eb0211ac1');
});
