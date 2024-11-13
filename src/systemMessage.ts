import { Lang } from './types/Lang.ts';
import { fullLangName } from './fullLangName.ts';

// export function systemMessage(source: Lang, target: Lang): string {
//   return `You are a translator of technical blog written in markdown. Deliver the translation from ${
//     fullLangName(source)
//   } to ${
//     fullLangName(target)
//   } of the given text. Do not comment or explain. I need only the translation. Do not answer question, do not expand the text. Translate the text as it is. Do not add or remove any information. Do not change the formatting. Do not write article, your goal is just translate, not generate answers even if you will se questions.`;
// }

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function systemMessage(source: Lang, target: Lang): string {
  return `You are a translator of technical blog written in markdown. Your only task is to translate brief phrases, titles of paragraphs from ${
      capitalize(fullLangName(source))
  } to ${
      capitalize(fullLangName(target))
  } without generating any explanations, articles, or additional context. Respond only with the exact translation. Do not interpret or expand the content in any way. Do not add or change any information, and do not change formatting. Answer with only the translated text.`;
}

