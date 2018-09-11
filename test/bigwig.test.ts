import request from "supertest";
import { Response } from "supertest";
import app from "../src/app";
import { gql } from "apollo-server-core";

const baseUrl = "http://localhost:8001/";
const testBWUrl = `${baseUrl}testbw.bigwig`;
const testBBUrl = `${baseUrl}testbb.bigbed`;

const query = `
    query BigRequests($bigRequests: [BigRequest!]!) {
        bigRequests(requests: $bigRequests) {
            data {
                chr, start, end
                ... on BigWigData {
                    value
                }
                ... on BigZoomData {
                    validCount, sumData, sumSquares, minVal, maxVal
                }
                ... on BigBedData {
                    name, score, strand, cdStart, cdEnd, color
                    exons { 
                        start, end 
                    }
                }
            }
            error
        }
    }
`;

describe("bigRequests queries", () => {
    test("should handle one bigwig request", async () => {
        const variables = {
            "bigRequests": [{ url: testBWUrl, chr1: "chr14", start: 19_485_000, end: 20_000_100 }]
        };
        const response: Response = await request(app).post("/graphql").send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.bigRequests[0].data.length).toBe(83);
        expect(response.body.data.bigRequests[0].error).toBeNull();
        expect(response.body.data.bigRequests[0].data[0]).toEqual({
            chr: "chr14", 
            start: 19_485_969, 
            end: 19_485_974, 
            value: 1
        });
        expect(response.body.data.bigRequests[0].data[10]).toEqual({
            chr: "chr14", 
            start: 19_486_029, 
            end: 19_486_030, 
            value: 1959
        });
    });

    test("should handle one large bigwig request", async () => {
        const variables = {
            "bigRequests": [{ url: testBWUrl, chr1: "chr1", start: 19_485_000, chr2: "chrX", end: 20_000_100 }]
        };
        const response: Response = await request(app).post("/graphql").send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.bigRequests[0].data.length).toBe(5074);
    });

    test("should handle zoom data requests", async () => {
        const variables = {
            "bigRequests": [{ url: testBWUrl, chr1: "chr2", start: 0, chr2: "chr6", end: 1000, zoomLevel: 100 }]
        };
        const response: Response = await request(app).post("/graphql").send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.bigRequests[0].data.length).toBe(66);
        expect(response.body.data.bigRequests[0].data[0]).toEqual({ 
            chr: "chr2", 
            start: 29_432_593, 
            end: 29_432_633, 
            validCount: 40, 
            sumData: 28_328,
            sumSquares: 25_059_680,
            minVal: 1,
            maxVal: 885
        });
        expect(response.body.data.bigRequests[0].data[28]).toEqual({ 
            chr: "chr3", 
            start: 178_916_553, 
            end: 178_916_593, 
            validCount: 40,
            sumData: 23_544,
            sumSquares: 17_853_998,
            minVal: 2,
            maxVal: 759
        });
    });

    test("should handle one bigbed request", async () => {
        const variables = {
            "bigRequests": [{ url: testBBUrl, chr1: "chr21", start: 10_000_000, chr2: "chr21", end: 20_000_000 }]
        };
        const response: Response = await request(app).post("/graphql").send({ query, variables });
        expect(response.status).toBe(200);
        const data = response.body.data.bigRequests[0].data;
        expect(data.length).toBe(46);
        expect(data[0].chr).toBe("chr21");
        expect(data[0].start).toBe(9_928_613);
        expect(data[0].end).toBe(10_012_791);
        expect(data[0].cdStart).toBe(9_928_775);
        expect(data[0].cdEnd).toBe(9_995_604);
        expect(data[0].strand).toBe("-");
        expect(data[0].exons.length).toBe(22);
        expect(data[0].exons[0].start).toBe(9_928_613);
        expect(data[0].exons[0].end).toBe(9_928_911);
    });

    test("should handle multiple requests at once", async () => {
        const variables = {
            "bigRequests": [
                { url: testBWUrl, chr1: "chr14", start: 19_485_000, end: 20_000_100 },
                { url: testBBUrl, chr1: "chr21", start: 10_000_000, chr2: "chr21", end: 20_000_000 }
            ]
        };
        const response: Response = await request(app).post("/graphql").send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.bigRequests[0].data.length).toBe(83);
        expect(response.body.data.bigRequests[1].data.length).toBe(46);
    });

})