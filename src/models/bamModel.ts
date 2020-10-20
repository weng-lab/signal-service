import { BamIndexRefData, Chunk, BamAlignment } from "genomic-reader";

export interface BamHeaderRequest {
    bamUrl: string;
    googleProject?: string;
}

export interface BamIndexRequest {
    baiUrl: string;
    refId: number;
    googleProject?: string;
}

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
    googleProject?: string;
}
