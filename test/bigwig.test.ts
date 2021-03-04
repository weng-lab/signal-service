import request from "supertest";
import { Response } from "supertest";
import app from "../src/app";
import { parseMultiplexedResponse } from "./util";

const baseUrl = "http://localhost:8001/";
const testBWUrl = `${baseUrl}testbw.bigwig`;
const testBBUrl = `${baseUrl}testbb.bigbed`;
const test2BitUrl = `${baseUrl}test.2bit`;
const testLargeBWUrl = `${baseUrl}ENCFF686NUN.bigWig`;

describe("/big queries", () => {
    test("should handle one bigwig request", async () => {
        const bigRequests = [{ url: testBWUrl, chr1: "chr14", start: 19_485_000, end: 20_000_100 }];
        const response: Response = await request(app).post("/big").send(bigRequests);
        expect(response.status).toBe(200);

        const results = parseMultiplexedResponse(response.text);
        expect(results[0].length).toBe(83);
        expect(results[0][0]).toEqual({
            chr: "chr14",
            start: 19_485_969,
            end: 19_485_974,
            value: 1
        });
        expect(results[0][10]).toEqual({
            chr: "chr14",
            start: 19_486_029,
            end: 19_486_030,
            value: 1959
        });
    });


    // skipped by default due to outside dependency on bigWig download from ENCODE
    // remove '.skip' to run if ../resources/static/ENCFF686NUN.bigWig exists
    test.skip("should handle one very large bigwig request", async () => {
        const bigRequests = [{ url: testLargeBWUrl, chr1: "chr14", start: 19_485_000, end: 20_000_100 }];
        const response: Response = await request(app).post("/big").send(bigRequests);
        expect(response.status).toBe(200);

        const results = parseMultiplexedResponse(response.text);
        expect(results[0].length).toBe(25_756);
    });

    test("should handle one large bigwig request", async () => {
        const bigRequests = [{ url: testBWUrl, chr1: "chr1", start: 19_485_000, chr2: "chrX", end: 20_000_100 }];
        const response: Response = await request(app).post("/big").send(bigRequests);
        expect(response.status).toBe(200);

        const results = parseMultiplexedResponse(response.text);
        expect(results[0].length).toBe(5074);
    });

    test("should handle one 2bit request", async () => {
        const bigRequests = [
            { url: test2BitUrl, chr1: "seq1", start: 1, end: 10 },
            { url: test2BitUrl, chr1: "seq1", start: 1, end: 100 },
            { url: test2BitUrl, chr1: "seq2", start: 1, end: 100 },
            { url: test2BitUrl, chr1: "seq1", start: 1, end: 2, oneHotEncodedFormat: true }
        ];
        const response: Response = await request(app).post("/big").send(bigRequests);
        expect(response.status).toBe(200);
        const results = parseMultiplexedResponse(response.text);
        expect(results[0]).toEqual("ACTGATGCTA");
        expect(results[1]).toEqual(
            'ACTGATGCTAGCTGATCGATGTGCATGTGCTGATGCTGATGTCANNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNCTATGCTGCGGGAGGG'
        );
        expect(results[2]).toEqual(
            'actgtgatcgatcgtagtcgtGTGACTGATCGTAGGCGTCGATGCGACGGCTAGTCGTAGCTGACTGATGCTGACTGgctgctgatcgatgctgatacgt'
        );
        expect(results[3][0]).toEqual(
            [[1,0,0,0],[0,1,0,0]]
        );
    });

    test("should handle zoom data requests", async () => {
        const bigRequests = [
            { url: testBWUrl, chr1: "chr2", start: 0, chr2: "chr6", end: 1000, zoomLevel: 100 },
            { url: testBWUrl, chr1: "chr2", start: 29_432_633, end: 30_432_633, zoomLevel: 1000 }
        ];
        const response: Response = await request(app).post("/big").send(bigRequests);
        expect(response.status).toBe(200);

        const results = parseMultiplexedResponse(response.text);
        expect(results[0].length).toBe(66);
        expect(results[0][0]).toEqual({
            chr: "chr2",
            start: 29_432_593,
            end: 29_432_633,
            validCount: 40,
            sumData: 28_328,
            sumSquares: 25_059_680,
            minVal: 1,
            maxVal: 885
        });
        expect(results[0][28]).toEqual({
            chr: "chr3",
            start: 178_916_553,
            end: 178_916_593,
            validCount: 40,
            sumData: 23_544,
            sumSquares: 17_853_998,
            minVal: 2,
            maxVal: 759
        });

        expect(results[1].length).toBe(3);
        expect(results[1][0]).toEqual({
            chr: "chr2",
            end: 29_432_793,
            maxVal: 1298,
            minVal: 1,
            start: 29_432_593,
            sumData: 154_443,
            sumSquares: 145_046_320,
            validCount: 188
        });
    });

    test("should handle one bigbed request", async () => {
        const bigRequests = [{ url: testBBUrl, chr1: "chr21", start: 10_000_000, chr2: "chr21", end: 20_000_000 }];
        const response: Response = await request(app).post("/big").send(bigRequests);
        expect(response.status).toBe(200);
        
        const results = parseMultiplexedResponse(response.text);
        expect(results[0].length).toBe(46);
        expect(results[0][0].chr).toBe("chr21");
        expect(results[0][0].start).toBe(9_928_613);
        expect(results[0][0].end).toBe(10_012_791);
        expect(results[0][0].cdStart).toBe(9_928_775);
        expect(results[0][0].cdEnd).toBe(9_995_604);
        expect(results[0][0].strand).toBe("-");
        expect(results[0][0].exons.length).toBe(22);
        expect(results[0][0].exons[0].start).toBe(9_928_613);
        expect(results[0][0].exons[0].end).toBe(9_928_911);
    });

    test("should handle multiple requests at once", async () => {
        const bigRequests = [
            { url: testBWUrl, chr1: "chr14", start: 19_485_000, end: 20_000_100 },
            { url: testBBUrl, chr1: "chr21", start: 10_000_000, chr2: "chr21", end: 20_000_000 }
        ];
        const response: Response = await request(app).post("/big").send(bigRequests);
        expect(response.status).toBe(200);

        const results = parseMultiplexedResponse(response.text);
        expect(results[0].length).toBe(83);
        expect(results[1].length).toBe(46);
    });

});

/*
 * Tests for the old style graphql bigwig requests
 * This functionality is deprecated and will be removed.
 */
const query = `
    query BigRequests($bigRequests: [BigRequest!]!) {
        bigRequests(requests: $bigRequests) {
            data,
            error {
                errortype,
                message
            }
        }
    }
`;

describe("/graphql bigRequests queries", () => {
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

    // skipped by default due to outside dependency on bigWig download from ENCODE
    // remove '.skip' to run if ../resources/static/ENCFF686NUN.bigWig exists
    test.skip("should handle one very large bigwig request", async () => {
        const variables = {
            "bigRequests": [{ url: testLargeBWUrl, chr1: "chr14", start: 19_485_000, end: 20_000_100 }]
        };
        const response: Response = await request(app).post("/graphql").send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.bigRequests[0].data.length).toBe(25_756);
        expect(response.body.data.bigRequests[0].error).toBeNull();
    });

    test("should handle one large bigwig request", async () => {
        const variables = {
            "bigRequests": [{ url: testBWUrl, chr1: "chr1", start: 19_485_000, chr2: "chrX", end: 20_000_100 }]
        };
        const response: Response = await request(app).post("/graphql").send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.bigRequests[0].data.length).toBe(5074);
    });

    test("should handle one 2bit request", async () => {
        const variables = {
            "bigRequests": [
                { url: test2BitUrl, chr1: "seq1", start: 1, end: 10 },
                { url: test2BitUrl, chr1: "seq1", start: 1, end: 100 },
                { url: test2BitUrl, chr1: "seq2", start: 1, end: 100 },
                { url: test2BitUrl, chr1: "seq1", start: 1, end: 10, oneHotEncodedFormat: true }
            ]
        };
        const response: Response = await request(app).post("/graphql").send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.bigRequests[0].data).toEqual(["ACTGATGCTA"]);
        expect(response.body.data.bigRequests[1].data).toEqual(
            ['ACTGATGCTAGCTGATCGATGTGCATGTGCTGATGCTGATGTCANNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNCTATGCTGCGGGAGGG']
        );
        expect(response.body.data.bigRequests[2].data).toEqual(
            ['actgtgatcgatcgtagtcgtGTGACTGATCGTAGGCGTCGATGCGACGGCTAGTCGTAGCTGACTGATGCTGACTGgctgctgatcgatgctgatacgt']
        );
        expect(response.body.data.bigRequests[3].data).toEqual(  [[1,0,0,0],[0,1,0,0],[0,0,0,1],[0,0,1,0],[1,0,0,0],[0,0,0,1],[0,0,1,0],[0,1,0,0],[0,0,0,1],[1,0,0,0]])
    });

    test("should handle zoom data requests", async () => {
        const variables = {
            "bigRequests": [
                { url: testBWUrl, chr1: "chr2", start: 0, chr2: "chr6", end: 1000, zoomLevel: 100 },
                { url: testBWUrl, chr1: "chr2", start: 29_432_633, end: 30_432_633, zoomLevel: 1000 },
                { url: testBWUrl, chr1: "chr2", start: 29_432_633, end: 30_432_633, zoomLevel: 10_000, preRenderedWidth: 1000 },
                { url: testBWUrl, chr1: "chr2", start: 29_432_633, end: 29_532_633, preRenderedWidth: 1000 }
            ]
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
        expect(response.body.data.bigRequests[1].data.length).toBe(3);
        expect(response.body.data.bigRequests[1].data[0]).toEqual({
            chr: "chr2",
            end: 29_432_793,
            maxVal: 1298,
            minVal: 1,
            start: 29_432_593,
            sumData: 154_443,
            sumSquares: 145_046_320,
            validCount: 188
        });
        expect(response.body.data.bigRequests[2].data.length).toBe(1001);
        expect(response.body.data.bigRequests[2].data[0]).toEqual({
            x: 0, max: 1298, min: 1
        });
        expect(response.body.data.bigRequests[2].data[10]).toEqual({
            x: 10, max: 1699, min: 1
        });
        expect(response.body.data.bigRequests[2].data[1]).toEqual({
            x: 1, max: null, min: null
        });
        expect(response.body.data.bigRequests[3].data[0]).toEqual({
            x: 0, max: 1298, min: 359
        });
        expect(response.body.data.bigRequests[3].data[8]).toEqual({
            x: 8, max: null, min: null
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

});