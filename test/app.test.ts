import request from "supertest";
import { Response } from "supertest";
import app from "../src/app";

describe("app", () => {
    test("/healthz should return 200", async () => {
        const response: Response = await request(app).get("/healthz");
        expect(response.status).toBe(200);
    });

    test("/rest should return list of rest endpoints", async () => {
        const response: Response = await request(app).get("/rest");
        expect(response.status).toBe(200);
        expect(response.body).toContain('/big');
        expect(response.body).toContain('/bam');
    });
});
