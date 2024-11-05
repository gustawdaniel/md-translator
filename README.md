## Scripts

Single sentence AI call, remove translation cache

```bash
deno -A sentence.ts
```

Format single file

```bash
deno -A format.ts ../blog/src/content/blog/en/2021-02-26-calculating-the-difference-between-json-files.md
```

Translate single document

```bash
deno -A main.ts ../blog/src/content/blog/en/2021-04-21-communication-between-vue-components-in-meteor.md es
```

Refine cache by correction sync

```bash
deno -A sync.ts ../blog/src/content/blog/en/2021-04-21-communication-between-vue-components-in-meteor.md es
```

## Stages:

Input:

- file path
- target language

Stage 1:

- get source language from the file path
- extract date and file slug from the file name

Stage 2:

| property      | action                                                   |
| ------------- | -------------------------------------------------------- |
| author        | no - author is no translated                             |
| canonicalName | no - canonical name is always english version of article |
| coverImage    | no                                                       |
| description   | translate                                                |
| excerpt       | translate                                                |
| publishDate   | set now only if wat not set before                       |
| slug          | translate -> slugify                                     |
| tags          | no                                                       |
| title         | translate                                                |
| updateDate    | set now is document was changed                          |

Stage 3:

Text and code organized to blocks. Each text block is translated, while code
left untouched.
