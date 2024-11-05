import OpenAI from 'npm:openai';
import {AiRequestDbRow} from "./types/AiRequestDbRow.ts";
import {md5} from "./md5.ts";
import { Database } from 'jsr:@db/sqlite@0.11';

export class AppAI {
    constructor(
        private readonly openai: OpenAI,
        private readonly db: Database,
    ) {
    }

    async callOpenAI(
        user: string,
        system: string,
    ): Promise<AiRequestDbRow> {
        const model = 'gpt-4o-mini';
        // model: "llama3.2:1b",

        const requestPayload: OpenAI.Chat.ChatCompletionCreateParams = {
            model,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
        };

        const inputHash = md5(requestPayload);

        const existingResponse = this.db.prepare(
            'SELECT * FROM ai_requests WHERE md5 = :md5',
        ).get({ md5: inputHash }) as AiRequestDbRow | undefined;

        if (existingResponse) {
            return existingResponse;
        }

        const requestTime = Date.now();

        // finishReason (https://platform.openai.com/docs/api-reference/chat/object)
        //
        // The reason the model stopped generating tokens. This will be `stop` if the model hit a natural stop point or a provided stop sequence, length if the maximum number of tokens specified in the request was reached, content_filter if content was omitted due to a flag from our content filters, tool_calls if the model called a tool, or function_call (deprecated) if the model called a function.
        const response = await this.openai.chat.completions.create(requestPayload);

        const responseTime = Date.now();

        const {
            choices,
            usage,
        } = response;

        const responseContent = choices[0]?.message?.content || '';

        const dbResponse = this.db.prepare(
            `INSERT INTO ai_requests (
            md5, 
            input, 
            responseContent, 
            finishReason, 
            promptTokens, 
            completionTokens, 
            totalTokens, 
            requestTime, 
            durationMs
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
        ).get([
            inputHash,
            JSON.stringify(requestPayload),
            responseContent,
            choices[0].finish_reason,
            usage?.prompt_tokens ?? 0,
            usage?.completion_tokens ?? 0,
            usage?.total_tokens ?? 0,
            BigInt(requestTime),
            responseTime - requestTime,
        ]) as AiRequestDbRow | undefined;


        if (!dbResponse) {
            throw new Error('Failed to insert the response into the database.');
        }

        console.log(`AI Req: Tokens ${dbResponse.totalTokens} in ${dbResponse.durationMs}ms [${
            dbResponse.responseContent.substring(0,40).replaceAll('\n', ' ')
        }]`);

        if(choices[0].finish_reason !== 'stop') {
            throw new Error(`Finish reason: ${choices[0].finish_reason}.`);
        }

        return dbResponse;
    }

}