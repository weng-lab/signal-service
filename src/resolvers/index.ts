import { GraphQLResolverMap } from "apollo-graphql";
import { bigResolvers, bigQueries } from "./bigwigResolver";
import { trackHubResolvers, trackHubQueries } from "./trackhubResolver";


export const resolvers: GraphQLResolverMap = {
    Query: {
        ...bigQueries,
        ...trackHubQueries
    },
    ...bigResolvers,
    ...trackHubResolvers
}