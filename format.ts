import {fileExists} from "./src/fileExists.ts";
import {ArticleFrontMatter} from "./src/types/ArticleFrontMatter.ts";
import {parseArticle} from "./src/parseArticle.ts";
import {stringifyArticle} from "./src/stringifyArticle.ts";

if (import.meta.main) {
    const [filePath] = Deno.args;

    if(await fileExists(filePath)) {
        const fileContent = await Deno.readTextFile(filePath);
        const content = parseArticle<ArticleFrontMatter>(fileContent);
        const text = stringifyArticle(content);

        // console.log(text);

        await Deno.writeTextFile(filePath, text);
    } else {
        console.log("File not exists.");
    }
}