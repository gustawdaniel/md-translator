import { Article } from './types/Article.ts';
import { ArticleFrontMatter } from './types/ArticleFrontMatter.ts';

export function stringifyArticle(article: Article<ArticleFrontMatter>): string {
  let text = '---\n';

  for (const [key, value] of Object.entries(article.head).toSorted()) {
    if (Array.isArray(value)) {
      text += `${key}:\n`;
      for (const item of value) {
        text += `- ${item}\n`;
      }
    } else {
      text += `${key}: ${value}\n`;
    }
  }

  text += '---\n';

  for (const component of article.body) {
    if (component.type === 'text') {
      text += '\n' + component.content + '\n';
    } else {
      text += '\n' + component.content + '\n';
    }
  }

  return text;
}
