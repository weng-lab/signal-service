import { BamIndexRefData, Chunk, BamAlignment } from "bigwig-reader";
import { ResponseWithError, RequestError } from "./commonModel";

export interface BamIndexRequest {
    baiUrl: string;
    bamUrl: string;
    chr: string;
}

export interface BamIndexResponse extends ResponseWithError<BamIndexResponseData> {}

export interface BamIndexResponseData {
    refId: number;
    indexRefData: BamIndexRefData;
}

export interface BamRequest {
    bamUrl: string;
    refId: number;
    chr: string;
    start: number;
    end: number;
    chunks: Chunk[];
}

export interface BamResponse extends ResponseWithError<BamAlignment[]> {}