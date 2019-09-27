import { gql, makeExecutableSchema } from "apollo-server-express";
import { trackHubResolvers } from "./resolvers/trackhubResolver";
import { bigwigResolvers } from "./resolvers/bigwigResolver";
import { bamResolvers } from "./resolvers/bamResolver";

export const typeDefs: any = gql`
    type Query {
        "Request BAM Parsed Index data for just one chromosome, and reference ID from BAM Header"
        bamIndexRequests(requests: [BamIndexRequest!]!, googleProject: String): [BamIndexResponse!]!
        "Request BAM Alignment data using regions from BAM index"
        bamRequests(requests: [BamRequest!]!, googleProject: String): [BamResponse!]!
        "Request BigWig / BigBed data"
        bigRequests(requests: [BigRequest!]!, googleProject: String): [BigResponse!]!
        "Request Trackhub data"
        trackHubRequests(trackhuburl: trackHubUrl!, googleProject: String): trackHubResponse!
    }
    
    type RequestError {
        errortype: String,
        message: String
    }

    input BamIndexRequest {
        "URL of the BAM Index (BAI) File"
        baiUrl: String!
        "URL of the BAM File"
        bamUrl: String!
        "Chromosome to request parsed index data for"
        chr: String!
    }

    type BamIndexResponse {
        data: BamIndexData
        error: RequestError
    }

    type BamIndexData {
        refId: Int!
        indexRefData: BamIndexRefData!
    }

    scalar BamIndexRefData

    input BamRequest {
        "URL of the BAM File"
        bamUrl: String!
        "Reference (Chromosome) ID used in BAM file"
        refId: Int!
        "Chrosome Name"
        chr: String!
        "Search Range Start"
        start: Int!
        "Search Range End"
        end: Int!
        "Bam File Regions where matching alignments may be"
        chunks: [Chunk!]!
    }

    input Chunk {
        start: VirtualOffset!,
        end: VirtualOffset!
    }

    input VirtualOffset {
        "Offset of the compressed data block"
        blockPosition: Int!,
        "Offset into the uncompressed data"
        dataPosition: Int!
    }

    type BamResponse {
        data: BamResponseData
        error: RequestError
    }

    scalar BamResponseData

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

export const schema: any = makeExecutableSchema({
    typeDefs,
    resolvers: [bamResolvers, bigwigResolvers, trackHubResolvers]
});
