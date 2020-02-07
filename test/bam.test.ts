import request from "supertest";
import { Response } from "supertest";
import app from "../src/app";
import { blocksForRange } from "bigwig-reader";
import { buildClientSchema } from "graphql";

const baseUrl = "http://localhost:8001/";
const testBamUrl = `${baseUrl}test.bam`;
const testBaiUrl = `${baseUrl}test.bam.bai`;

jest.setTimeout(30000);

const bamIndexQuery = `
    query BamIndexRequests($bamIndexRequests: [BamIndexRequest!]!) {
        bamIndexRequests(requests: $bamIndexRequests) {
            data {
                refId,
                indexRefData
            },
            error {
                errortype,
                message
            }
        }
    }
`;

const bamQuery = `
    query BamRequests($bamRequests: [BamRequest!]!) {
        bamRequests(requests: $bamRequests) {
            data,
            error {
                errortype,
                message
            }
        }
    }
`;

describe("bamIndexRequests and bamRequests queries", () => {
    test("should handle one index and bam request", async () => {
        const variables1 = {
            "bamIndexRequests": [{ baiUrl: testBaiUrl, bamUrl: testBamUrl, chr: "chr22" }]
        };
        const response1: Response = await request(app).post("/graphql")
            .send({ query: bamIndexQuery, variables: variables1 });
        expect(response1.status).toBe(200);
        const baiResponse = response1.body.data.bamIndexRequests[0].data;
        expect(baiResponse.refId).toBe(21);
        expect(Object.keys(baiResponse.indexRefData.binIndex)).toHaveLength(880);
        expect(baiResponse.indexRefData.linearIndex).toHaveLength(3102);

        const start = 20_890_000;
        const end = 20_910_000;
        const chunks = blocksForRange(baiResponse.indexRefData, baiResponse.refId, start, end);
        const variables2 = {
            "bamRequests": [{ bamUrl: testBamUrl, refId: baiResponse.refId, chr: "chr22", start, end, chunks }]
        };
        const response2: Response = await request(app).post("/graphql")
            .send({ query: bamQuery, variables: variables2 });
        expect(response2.status).toBe(200);
        const bamResponse = response2.body.data.bamRequests[0].data;
        expect(bamResponse).toHaveLength(300);
        expect(bamResponse[0].chr).toBe("chr22");
        expect(bamResponse[0].seq).toBe("TGTTCAGACCCTCTCGTTCTACGTCCTGTGCTGAGG");
    });

});
