import { gql } from "apollo-server-express";
import { buildFederatedSchema } from "@apollo/federation";
import { resolvers } from "./resolvers";

export const typeDefs: any = gql`
    type Query {
        "Request BigWig / BigBed data"
        bigRequests(requests: [BigRequest!]!, googleProject: String): [BigResponse!]!
        "Request Trackhub data"
        trackHubRequests(trackhuburl: trackHubUrl!, googleProject: String): trackHubResponse!
    }
    
    type RequestError {
        errortype: String,
        message: String
    }

    input BigRequest {
        "URL of the file to request data from"
        url: String!
        "Start chromosome"
        chr1: String!
        "Start base pair"
        start: Int!
        "(Optional) End chromosome. Start chromosome will be used if omitted."
        chr2: String
        "End base pair"
        end: Int!
        "(Optional) Base pairs per item. Picks the highest available in the file without going over."
        zoomLevel: Int
        "(Optional) If passed, pre-renders BigWig data to match the given number of bins to save download and rendering time on the frontend."
        preRenderedWidth: Int
    }

    type BigResponse {
        data: [BigResponseData]
        error: RequestError
    }

    type SingleBigResponse {
        data: BigResponseData
        error: RequestError
    }

    type BigResponseWithRange @key(fields: "chrom start end url") {
        chrom: String!
        start: Int! 
        end: Int! 
        url: String! 
        data: SingleBigResponse    
    }    

    scalar BigResponseData

    input trackHubUrl {
        trackHubUrl: String
        hubUrl: Boolean!
    }
    interface trackHubResponse {
        trackhubname: String
    }
    type TrackHubGenomes implements trackHubResponse {
        trackhubname: String
        genomes: [Genomes]!
    }
    type TrackHub implements trackHubResponse {
        trackhubname: String
        trackHubContent: String!
    }
    type Genomes {
        genome: String!
        trackDb: String!
        defaultPos: String
    }
`;

export const schema = buildFederatedSchema([{ typeDefs, resolvers }]);