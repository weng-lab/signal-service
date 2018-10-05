import { gql, makeExecutableSchema } from "apollo-server-express";
import { trackHubResolvers } from "../resolvers/trackhubResolver";
export const trackHubtypeDefs = gql`
    type Query {
        trackHubRequests(trackhuburl: trackHubUrl!): trackHubResponse!
    }
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

export const trackHubSchema = makeExecutableSchema({
    typeDefs: trackHubtypeDefs,
    resolvers: trackHubResolvers
});
