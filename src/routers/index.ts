import * as express from "express";
import { bigHandler } from "./bigwig";

export const api = express.Router()
        .post('/big', bigHandler);
        