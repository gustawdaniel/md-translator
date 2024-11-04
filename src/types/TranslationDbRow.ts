import {Lang} from "./Lang.ts";

export interface TranslationDbRow {
    sourceLang: Lang;
    targetLang: Lang;
    sourceText: string;
    targetText: string;
}