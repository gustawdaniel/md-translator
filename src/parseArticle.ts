import { splitOnFirstOccurrence } from './splitOnFirstOccurrence.ts';
import { Article } from './types/Article.ts';
import { ArticleComponent } from './types/ArticleComponent.ts';

function trimArticleComponentContent(
  component: ArticleComponent,
): ArticleComponent {
  return {
    type: component.type,
    content: component.content.trim(),
  };
}

function pushToComponents(
  components: ArticleComponent[],
  component: ArticleComponent,
) {
  const trimmedComponent = trimArticleComponentContent(component);
  if (trimmedComponent.content) {
    components.push(trimmedComponent);
  }
}

function defaultComponent(): ArticleComponent {
  return {
    type: 'text',
    content: '',
  };
}

export function parseArticle<T>(
  content: string,
): Article<T> {
  const parts = content.split('\n---\n');
  const headContent = parts[0].replace('---\n', '');

  const head: Record<string, unknown> = {};
  let currentHeadKey: string | null = null;

  for (const line of headContent.split('\n')) {
    const [key, value] = splitOnFirstOccurrence(line, ':').map((s) => s.trim());

    if (line.includes(':')) {
      if (key && value) {
        head[key] = value;
      }
      currentHeadKey = key; // Track the key for potential multiline values
    } else if (key && key.trim().startsWith('-') && !value) {
      // Handle array items for keys like `tags`
      if (currentHeadKey) {
        if (!head[currentHeadKey]) {
          head[currentHeadKey] = [];
        }

        (head[currentHeadKey] as string[]).push(
          key.replace('-', '').trim(),
        );
      }
    } else if (currentHeadKey && line.startsWith('  ')) {
      // Line starts with spaces and is part of a multiline value
      head[currentHeadKey] += ` ${line.trim()}`;
    }
  }

  const bodyContent = parts.slice(1).join('\n---\n');

  const components: ArticleComponent[] = [];

  let currentComponent = defaultComponent();

  for (const line of bodyContent.split('\n')) {
    if (line.startsWith('```')) {
      if (currentComponent.type === 'code') {
        currentComponent.content += line + '\n';
      }

      pushToComponents(components, currentComponent);
      currentComponent = {
        type: currentComponent.type === 'text' ? 'code' : 'text',
        content: currentComponent.type === 'text' ? line + '\n' : '',
      };
    } else if (
      currentComponent.type === 'text' && line.startsWith('![') &&
      line.endsWith(')') && line.includes('](')
    ) {
      pushToComponents(components, currentComponent);
      pushToComponents(components, {
        type: 'img',
        content: line,
      });
      currentComponent = defaultComponent();
    } else {
      currentComponent.content += line + '\n';
    }
  }

  pushToComponents(components, currentComponent);

  return {
    head: head as T,
    body: components,
  };
}
