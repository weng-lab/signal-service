export interface BigRequest {
    url: string;
    chr1: string;
    start: number;
    chr2?: string;
    end: number;
    zoomLevel?: number;
}

export interface BigResponse {
    data?: BigResponseData,
    error?: string
}

export type BigResponseData = BigWigData[] | BigBedData[] | BigZoomData[]

export interface BigWigData {
    chr: string;
    start: number;
    end: number;
    value: number;
}

export interface BigBedData {
    chr: string;
    start: number;
    end: number;
    name?: string;
    score?: number;
    strand?: string;
    cdStart?: number;
    cdEnd?: number;
    color?: string;
    exons?: Array<BigBedExon>;
}

export interface BigZoomData {
    chr: string,
    start: number,
    end: number,
    validCount: number,
    minVal: number,
    maxVal: number,
    sumData: number,
    sumSquares: number
}

export interface BigBedExon {
    start: number;
    end: number;
}