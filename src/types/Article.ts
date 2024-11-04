import {ArticleComponent} from "./ArticleComponent.ts";

export interface Article<T> {
    head: T;
    body: ArticleComponent[];
}