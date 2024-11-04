export interface AiRequestDbRow {
    md5: string; //"291d6163322db588d1ffd156fd70dc69",
    input: string; //'{"model":"gpt-4o-mini","messages":[{"role":"system","content":"You are a translator of technical blog written in markdown. Deliver the translation from english to polish of the given text. Do not comment or explain. I need only the translation."},{"role":"user","content":"calculating-the-difference-between-json-files"}]}',
    responseContent: string; //"obliczanie-różnicy-między-plikami-json",
    finishReason:
        | 'stop'
        | 'length'
        | 'content_filter'
        | 'tool_calls'
        | 'function_call';
    promptTokens: bigint; //54n;
    completionTokens: bigint; //13n;
    totalTokens: bigint; //67n;
    requestTime: bigint; //1730665057022n;
    durationMs: bigint; //1125n;
}