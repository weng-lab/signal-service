import request from "supertest";
import { Response } from "supertest";
import app from "../src/app";

describe("app", () => {
    test("/healthz should return 200", async () => {
        const response: Response = await request(app).get("/healthz");
        expect(response.status).toBe(200);
    });
});
