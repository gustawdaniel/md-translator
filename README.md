Next steps:

- [ ] Create `frontmatter` for the post
- [ ] translate the text fragments
- [ ] assemble the post
- [ ] save the post in correct path
- [ ] accept all directory instead of just one post
- [ ] add information about last file modification date

Architecture:

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

---

Format

```bash
deno -A format.ts ../blog/src/content/blog/en/2021-02-26-calculating-the-difference-between-json-files.md
```

Translate single document

```
deno -A main.ts ../blog/src/content/blog/en/2021-04-21-communication-between-vue-components-in-meteor.md es
```