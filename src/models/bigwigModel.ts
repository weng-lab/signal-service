import { ResponseWithError, RequestError } from "./commonModel";

export interface BigRequest {
    url: string;
    googleProject?: string;
    chr1: string;
    start: number;
    chr2?: string;
    end: number;
    zoomLevel?: number;
    preRenderedWidth?: number;
}


export interface BigResponse extends ResponseWithError<BigResponseData> {}

export type BigResponseData = BigWigData[] | BigBedData[] | BigZoomData[] | PreRenderedBigWigData[] | string[];

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

export interface PreRenderedBigWigData {
    x: number;
    min: number;
    max: number;
}

export interface BigZoomData {
    chr: string;
    start: number;
    end: number;
    validCount?: number;
    minVal: number;
    maxVal: number;
    sumData?: number;
    sumSquares?: number;
}

export interface BigBedExon {
    start: number;
    end: number;
}
