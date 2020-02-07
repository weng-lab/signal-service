import { passThroughScalar, dataLoaderForArgs, wrapRequest } from "../util";
import { BamIndexRequest, BamIndexResponse, BamIndexResponseData, BamRequest, BamResponse } from "../models/bamModel";
import { readBamIndex, BamIndexData } from "bigwig-reader/dist/bam/BamIndexReader";
import { readBamHeaderData } from "bigwig-reader/dist/bam/BamHeaderReader";
import { BamAlignment, readBam } from "bigwig-reader";

/**
 * Apollo server graphql resolver for batched bam index data requests.
 *
 * @param obj Unused. Needed by Apollo server resolver function signature.
 */
async function bamIndexRequests(obj: any, { requests }: { requests: Array<BamIndexRequest> } | any): Promise<BamIndexResponse[]> {
    const bamIndexPromises = requests.map((request: BamIndexRequest) => wrapRequest(bamIndexRequest(request)));
    return Promise.all(bamIndexPromises);
}

async function bamIndexRequest(request: BamIndexRequest): Promise<BamIndexResponseData> {
    const bamIndexLoader = dataLoaderForArgs(request.baiUrl, request.googleProject);
    const bamLoader = dataLoaderForArgs(request.bamUrl, request.googleProject);
    const fullIndexData: BamIndexData = await readBamIndex(bamIndexLoader);
    const headerData = await readBamHeaderData(bamLoader, fullIndexData.firstAlignmentBlock);
    const refId = headerData.chromToId[request.chr];
    const indexRefData = fullIndexData.refData[refId];
    return { refId, indexRefData };
}

async function bamRequests(obj: any, { requests }: { requests: Array<BamRequest> } | any): Promise<BamResponse[]> {
    const bamPromises = requests.map((request: BamRequest) => wrapRequest(bamRequest(request)));
    return Promise.all(bamPromises);
}

async function bamRequest(request: BamRequest): Promise<BamAlignment[]> {
    const bamLoader = dataLoaderForArgs(request.bamUrl, request.googleProject);
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
