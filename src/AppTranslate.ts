import { Database } from 'jsr:@db/sqlite@0.11';
import {AppAI} from "./AppAI.ts";
import {Lang} from "./types/Lang.ts";
import {TranslationDbRow} from "./types/TranslationDbRow.ts";
import {systemMessage} from "./systemMessage.ts";

export class AppTranslate {
    constructor(
        private readonly appAi: AppAI,
        private readonly db: Database,
    ) {
    }

    async translateSentence(
        sourceText: string,
        sourceLang: Lang,
        targetLang: Lang,
    ): Promise<string> {
        const existingResponse = this.db.prepare(
            'SELECT * FROM translations WHERE sourceLang = :sourceLang AND targetLang = :targetLang AND sourceText = :sourceText',
        ).get({ sourceLang, targetLang, sourceText }) as TranslationDbRow | undefined;

        if (existingResponse) {
            return existingResponse.targetText;
        }

        const system = systemMessage(sourceLang, targetLang);

        const translation = await this.appAi.callOpenAI(sourceText, system);
        const targetText = translation.responseContent;

        const dbResponse = this.db.prepare(
            `INSERT INTO translations (
            sourceLang,
            targetLang,
            sourceText,
            targetText
        ) VALUES (?, ?, ?, ?) RETURNING *`,
        ).get([
            sourceLang,
            targetLang,
            sourceText,
            targetText,
        ]) as TranslationDbRow | undefined;

        if (!dbResponse) {
            throw new Error('Failed to insert the translation into the database.');
        }

        console.log(`Translation: ${sourceLang} => ${targetLang} saved [${sourceText.substring(0,20)} => ${targetText.substring(0,20)}]`);

        return dbResponse.targetText;
    }
}