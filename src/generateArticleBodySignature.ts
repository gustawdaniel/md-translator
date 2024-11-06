import { ArticleComponent } from './types/ArticleComponent.ts';

export function generateArticleBodySignature(
  articleBody: ArticleComponent[],
): string {
  return articleBody.map((component) => {
    switch (component.type) {
      case 'code':
        return 'c';
      case 'text':
        return 't';
      case 'img':
        return 'i';
      default:
        throw new Error(`Unknown component type: ${component.type}`);
    }
  }).join('');
}
