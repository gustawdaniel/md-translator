import { Lang } from './types/Lang.ts';
import { FullLangName } from './types/FullLangName.ts';

export function fullLangName(lang: Lang): FullLangName {
  switch (lang) {
    case 'pl':
      return 'polish';
    case 'en':
      return 'english';
    case 'es':
      return 'spanish';
  }
}
