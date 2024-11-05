import { encode, Hash } from 'https://deno.land/x/checksum@1.4.0/mod.ts';

export function md5(input: object): string {
  return new Hash('md5').digest(encode(JSON.stringify(input))).hex();
}
