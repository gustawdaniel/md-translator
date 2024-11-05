import { Database } from 'jsr:@db/sqlite@0.11';

export function prepareDbSchema(db: Database) {
  // Create the table if it doesn't exist
  db.exec(`
  CREATE TABLE IF NOT EXISTS ai_requests (
    md5 TEXT PRIMARY KEY,
    input TEXT NOT NULL,
    translatedText TEXT NOT NULL,
    finishReason TEXT NOT NULL,
    promptTokens INTEGER NOT NULL,
    completionTokens INTEGER NOT NULL,
    totalTokens INTEGER NOT NULL,
    requestTime INTEGER NOT NULL,
    durationMs INTEGER NOT NULL
  );
`);

  db.exec(`
  CREATE TABLE IF NOT EXISTS translations (
    sourceLang TEXT NOT NULL,
    targetLang TEXT NOT NULL,
    sourceText TEXT NOT NULL,
    targetText TEXT NOT NULL
  );
`);

  db.exec(`
  CREATE INDEX IF NOT EXISTS idx_translations_source_target_text
  ON translations (sourceLang, targetLang, sourceText);
`);
}
