import { passThroughScalar, dataLoaderForArgs, wrapRequest } from "../util";
import { BamIndexRequest, BamIndexResponse, BamIndexResponseData, BamRequest, BamResponse } from "../models/bamModel";
import { readBamIndex, BamIndexData } from "bigwig-reader/dist/bam/BamIndexReader";
import { readBamHeaderData } from "bigwig-reader/dist/bam/BamHeaderReader";
import { BamAlignment, readBam } from "bigwig-reader";

type BamIndexRequests = { requests: Array<BamIndexRequest>, googleProject: string };
type BamRequests = { requests: Array<BamRequest>, googleProject: string };

/**
 * Apollo server graphql resolver for batched bam index data requests.
 *
 * @param obj Unused. Needed by Apollo server resolver function signature.
 */
async function bamIndexRequests(obj: any, { requests, googleProject }: BamIndexRequests | any): Promise<BamIndexResponse[]> {
    const bamIndexPromises = requests.map((request: BamIndexRequest) => wrapRequest(bamIndexRequest(request, googleProject)));
    return Promise.all(bamIndexPromises);
}

async function bamIndexRequest(request: BamIndexRequest, googleProject: string): Promise<BamIndexResponseData> {
    const bamIndexLoader = dataLoaderForArgs(request.baiUrl, googleProject);
    const bamLoader = dataLoaderForArgs(request.bamUrl, googleProject);
    const fullIndexData: BamIndexData = await readBamIndex(bamIndexLoader);
    const headerData = await readBamHeaderData(bamLoader, fullIndexData.firstAlignmentBlock);
    const refId = headerData.chromToId[request.chr];
    const indexRefData = fullIndexData.refData[refId];
    return { refId, indexRefData };
}

async function bamRequests(obj: any, { requests, googleProject }: BamRequests | any): Promise<BamResponse[]> {
    const bamPromises = requests.map((request: BamRequest) => wrapRequest(bamRequest(request, googleProject)));
    return Promise.all(bamPromises);
}

async function bamRequest(request: BamRequest, googleProject: string): Promise<BamAlignment[]> {
    const bamLoader = dataLoaderForArgs(request.bamUrl, googleProject);
    return readBam(bamLoader, request.chunks, request.refId, request.chr, request.start, request.end);
}

export const bamResolvers = {
    Query: {
        bamIndexRequests,
        bamRequests
    },
    BamIndexRefData: passThroughScalar("BamIndexRefData",
        "Bam Index Data for a single reference (chromosome)."),
    BamResponseData: passThroughScalar("BamResponseData",
        "Bam Alignment Data for Bam Range Lookup.")
};
