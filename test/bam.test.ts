import request from "supertest";
import { Response } from "supertest";
import app from "../src/app";
import { parseRawIndexRefData, BamIndexRefData, BamHeader, blocksForRange, BamAlignment } from "genomic-reader";
import { BamHeaderRequest, BamIndexRequest, BamRequest } from "../src/models/bamModel";

const baseUrl = "http://localhost:8001/";
const testBamUrl = `${baseUrl}test.bam`;
const testBaiUrl = `${baseUrl}test.bam.bai`;

jest.setTimeout(30000);

describe("bamIndexRequests and bamRequests queries", () => {
    test("should handle one bam header, index and data request", async () => {
        const bamHeaderRequest: BamHeaderRequest = { bamUrl: testBamUrl };
        const bamHeaderResponse: Response = await request(app).post("/bamHeader").send(bamHeaderRequest);
        expect(bamHeaderResponse.status).toBe(200);
        const bamHeaderData = bamHeaderResponse.body as BamHeader;

        const chr = "chr22";
        const refId = bamHeaderData.chromToId[chr];
        const bamIndexRequest: BamIndexRequest = { baiUrl: testBaiUrl, refId };
        const bamIndexResponse: Response = await request(app).post("/bamIndex").send(bamIndexRequest);
        expect(bamIndexResponse.status).toBe(200);        
        
        const bamIndexData: BamIndexRefData = parseRawIndexRefData((bamIndexResponse.body as Buffer).buffer);
        expect(bamIndexData.linearIndex.length).toBe(3102);
        
        const start = 20_890_000;
        const end = 20_910_000;
        const chunks = blocksForRange(bamIndexData, start, end);
        const bamRequest: BamRequest = { bamUrl: testBamUrl, refId, chr, start, end, chunks };
        const bamResponse: Response = await request(app).post("/bam").send(bamRequest);

        const bamData = bamResponse.body as BamAlignment[];
        expect(bamData).toHaveLength(300);
        expect(bamData[0].chr).toBe("chr22");
        expect(bamData[0].seq).toBe("TGTTCAGACCCTCTCGTTCTACGTCCTGTGCTGAGG");
    });
});
