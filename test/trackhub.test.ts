import request from "supertest";
import { Response } from "supertest";
import app from "../src/app";

const baseUrl = "http://localhost:8001/";
const testTrackHubGenomeUrl = `${baseUrl}hub.txt`;
const testTrackHubUrl = `${baseUrl}trackDb.txt`;

const trackHubQuery = `
  query trackHubRequests($url: trackHubUrl!) {
    trackHubRequests(trackhuburl: $url)  {
         trackhubname
             ... on TrackHubGenomes {          
           genomes{
             trackDb
             defaultPos
             genome
           }
         }  
         ... on TrackHub {
           trackHubContent
         }
   }
 }`;

describe("trackHub queries", () => {
    test("fetch trackHub genomes", async () => {
        const variables = {
            url: { trackHubUrl: testTrackHubGenomeUrl, hubUrl: true }
        };
        const hubGenomesResponse: Response = await request(app)
            .post("/graphql")
            .send({ query: trackHubQuery, variables });

        expect(hubGenomesResponse.status).toBe(200);
        expect(hubGenomesResponse.body.data.trackHubRequests.trackhubname.trim()).toEqual("ENCODE Trackhub Test6");

        expect(hubGenomesResponse.body.data.trackHubRequests.genomes[0]).toEqual({
            trackDb: "mm10/trackDb.txt",
            defaultPos: "chr2:163423234-163655010",
            genome: "mm10"
        });
    });
    test("fetch trackHub", async () => {
        const hubvariables = {
            url: { trackHubUrl: testTrackHubUrl, hubUrl: false }
        };
        const hubResponse: Response = await request(app)
            .post("/graphql")
            .send({ query: trackHubQuery, variables: hubvariables });
        expect(hubResponse.status).toBe(200);
    });
});
