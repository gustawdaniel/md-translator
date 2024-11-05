import { Lang } from './types/Lang.ts';

export function isLang(value: string): value is Lang {
  return ['pl', 'en', 'es'].includes(value);
}
