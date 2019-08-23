import { passThroughScalar, dataLoaderForArgs, wrapRequest } from "./util";
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
    return Promise.all(requests.map((request: BamIndexRequest) => bamIndexRequest(request)));
}

async function bamIndexRequest(request: BamIndexRequest): Promise<BamIndexResponse> {
    const read = async (): Promise<BamIndexResponseData> => {
        const bamIndexLoader = dataLoaderForArgs(request.baiUrl, request.googleProject);
        const bamLoader = dataLoaderForArgs(request.bamUrl, request.googleProject);
        const fullIndexData: BamIndexData = await readBamIndex(bamIndexLoader);
        const headerData = await readBamHeaderData(bamLoader, fullIndexData.firstAlignmentBlock);
        const refId = headerData.chromToId[request.chr];
        const indexRefData = fullIndexData.refData[refId];
        return { refId, indexRefData };
    }
    return wrapRequest(read);
}

async function bamRequests(obj: any, { requests }: { requests: Array<BamRequest> } | any): Promise<BamResponse[]> {
    return Promise.all(requests.map((request: BamRequest) => bamRequest(request)));
}

async function bamRequest(request: BamRequest): Promise<BamResponse> {
    const read = async (): Promise<BamAlignment[]> => {
        const bamLoader = dataLoaderForArgs(request.bamUrl, request.googleProject);
        return readBam(bamLoader, request.chunks, request.refId, request.chr, request.start, request.end);
    }
    return wrapRequest(read);
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
