import * as express from "express";
import { bigHandler } from "./bigwig";
import { bamHeaderHandler, bamIndexHandler, bamHandler } from "./bam";

export const api = express.Router()
        .post('/big', bigHandler)
        .post('/bamHeader', bamHeaderHandler)
        .post('/bamIndex', bamIndexHandler)
        .post('/bam', bamHandler);

// Distinct list of only paths from this router.
const paths = [... new Set(api.stack.filter(r => r.route).map(r => r.route.path))];
api.get('/rest', (_, res) => res.send(paths));