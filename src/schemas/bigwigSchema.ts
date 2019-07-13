import { gql, makeExecutableSchema } from "apollo-server-express";
import { bigwigResolvers } from "../resolvers/bigwigResolver";

export const typeDefs: any = gql`
    type Query {
        bigRequests(requests: [BigRequest!]!): [BigResponse!]!
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
        error: BigError
    }

    type BigError {
        errortype: String,
        message: String
    }

    scalar BigResponseData

`;

export const bigWigSchema: any = makeExecutableSchema({
    typeDefs,
    resolvers: bigwigResolvers
});
