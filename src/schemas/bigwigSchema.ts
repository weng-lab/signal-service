import { gql, makeExecutableSchema } from "apollo-server-express";
import { bigwigResolvers } from "../resolvers/bigwigResolver";

export const typeDefs = gql`
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
    }

    type BigResponse {
        data: [BigResponseData]
        error: String
    }

    scalar BigResponseData

`;

export const bigWigSchema = makeExecutableSchema({
    typeDefs,
    resolvers: bigwigResolvers
});
