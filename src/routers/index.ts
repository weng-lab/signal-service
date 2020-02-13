import * as express from "express";
import { bigHandler } from "./bigwig";
import { bamHeaderHandler, bamIndexHandler, bamHandler } from "./bam";

export const api = express.Router()
        .post('/big', bigHandler)
        .post('/bamHeader', bamHeaderHandler)
        .post('/bamIndex', bamIndexHandler)
        .post('/bam', bamHandler);
        