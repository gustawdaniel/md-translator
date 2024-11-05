import { Lang } from './types/Lang.ts';
import { isLang } from './isLang.ts';

export class FilePath {
  public basePath: string;
  public lang: Lang;
  public date: string;
  public canonicalName: string;

  constructor(filePath: string) {
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const lang = pathParts[pathParts.length - 2];
    const basePath = pathParts.filter((_, index) =>
      index < pathParts.length - 2
    );

    const match = fileName.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
    if (!match) {
      throw new Error('The file name does not match the expected pattern.');
    }

    this.basePath = basePath.join('/');
    this.lang = [lang].filter(isLang)[0];
    this.date = match[1];
    this.canonicalName = match[2];
  }

  public toString(): string {
    return `${this.basePath}/${this.lang}/${this.date}-${this.canonicalName}.md`;
  }
}
