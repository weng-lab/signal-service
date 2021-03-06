import { passThroughScalar, dataLoaderForArgs, wrapRequest, wrapRequestWithInput } from "../util";
import { 
    BigWigReader, FileType, ZoomLevelHeader 
} from "genomic-reader";
import { 
    BigResponse, BigResponseData, BigRequest, 
    BigZoomData, PreRenderedBigWigData, BigWigData 
} from "../models/bigwigModel";

type BigRequests = { requests: Array<BigRequest>, googleProject: string };

/*
Return two bit data for region and url from external service
*/
async function getTwoBitData(args: {url: string, start: number, chrom: string, end: number, googleProject?: string}): Promise<any> {
    
    const loader = dataLoaderForArgs(args.url, args.googleProject);
    let reader = new BigWigReader(loader);
    let read: Promise<BigResponseData> = readTwoBitDataMatrix({ url: args.url, chr1: args.chrom, start: args.start, end: args.end, oneHotEncodedFormat: true}, reader) 
    return {
            chrom: args.chrom,
            start: args.start,
            end: args.end,
            url: args.url,
            data: await read
        }
}

/**
 * Apollo server graphql resolver for batched bigwig / bigbed data requests.
 *
 * @param obj Unused. Needed by Apollo server resolver function signature.
 */
async function bigRequests(obj: any, { requests, googleProject }: BigRequests | any): Promise<BigResponse[]> {
    const urls: Set<string> = new Set(requests.map( (request: BigRequest): string => request.url ));
    const readers: { [url: string]: BigWigReader } = [...urls].reduce(
        (map: { [url: string]: BigWigReader }, url: string): { [url: string]: BigWigReader } => ({
            ...map,
            [url]: new BigWigReader(dataLoaderForArgs(url, googleProject))
        }), {}
    );
    return Promise.all(requests.map((request: BigRequest) => bigRequest(request, readers[request.url])));
}

function getDomain(values: { start: number, end: number }[]): { start: number, end: number } {
    let domain: { start: number, end: number } = { start: Infinity, end: -Infinity };
    values.forEach((value: { start: number, end: number }): void => {
        if (value.start < domain.start) domain.start = value.start;
        if (value.end > domain.end) domain.end = value.end;
    });
    return domain;
}

function initialPreRenderedValues(xdomain: { start: number, end: number }): PreRenderedBigWigData[] {
    let retval: PreRenderedBigWigData[] = [];
    for (let i: number = xdomain.start; i <= xdomain.end; ++i) {
        retval.push({
            x: i,
            max: -Infinity,
            min: Infinity
        });
    }
    return retval;
}

/**
 * Creates a promise for condensing zoomed bigWig data to return exactly one element per pixel.
 *
 * @param data the zoom data returned by the bigWig reader
 * @param request the request, containing coordinates and number of basepairs per pixel
 */
async function condensedData(data: BigWigData[], preRenderedWidth: number, request?: BigRequest): Promise<PreRenderedBigWigData[]> {

    let domain: { start: number, end: number } = request ? { start: request!.start, end: request!.end } : getDomain(data);
    let x: (i: number) => number = i => (i - domain.start) * preRenderedWidth / (domain.end - domain.start);

    let cbounds: { start: number, end: number } = { start: Math.floor(x(domain.start)), end: Math.floor(x(domain.end)) };
    let retval = initialPreRenderedValues(cbounds);

    data.forEach((point: BigWigData): void => {
        let cxs: number = Math.floor(x(point.start < domain.start ? domain.start : point.start));
        let cxe: number = Math.floor(x(point.end > domain.end ? domain.end : point.end));
        if (point.value < retval[cxs].min) {
            retval[cxs].min = point.value;
        }
        if (point.value > retval[cxs].max) {
            retval[cxs].max = point.value;
        }
        for (let i: number = cxs + 1; i <= cxe; ++i) {
            retval[i].min = point.value;
            retval[i].max = point.value;
        }
    });
    return retval;

}

/**
 * Creates a promise for condensing zoomed bigWig data to return exactly one element per pixel.
 *
 * @param data the zoom data returned by the bigWig reader
 * @param request the request, containing coordinates and number of basepairs per pixel
 */
async function condensedZoomData(data: BigZoomData[], preRenderedWidth: number, request?: BigRequest): Promise<PreRenderedBigWigData[]> {

    let domain: { start: number, end: number } = request ? { start: request!.start, end: request!.end } : getDomain(data);
    let x: (i: number) => number = i => (i - domain.start) * preRenderedWidth / (domain.end - domain.start);

    let cbounds: { start: number, end: number } = { start: Math.floor(x(domain.start)), end: Math.floor(x(domain.end)) };
    let retval = initialPreRenderedValues(cbounds);

    data.forEach((point: BigZoomData): void => {
        let cxs: number = Math.floor(x(point.start < domain.start ? domain.start : point.start));
        let cxe: number = Math.floor(x(point.end > domain.end ? domain.end : point.end));
        if (point.minVal < retval[cxs].min) {
            retval[cxs].min = point.minVal;
        }
        if (point.maxVal > retval[cxs].max) {
            retval[cxs].max = point.maxVal;
        }
        for (let i: number = cxs + 1; i <= cxe; ++i) {
            retval[i].min = point.minVal;
            retval[i].max = point.maxVal;
        }
    });
    return retval;
}

async function readTwoBitData(request: BigRequest, reader: BigWigReader): Promise<string[]> {
    return [await reader.readTwoBitData(request.chr1, request.start, request.end)];
}

async function readTwoBitDataMatrix(request: BigRequest, reader: BigWigReader): Promise<number[][]> {
    return await reader.readTwoBitDataMatrix(request.chr1, request.start, request.end);
}

/**
 * Creates a Promise for processing a single BigRequest.
 *
 * @param request the BigRequest to handle.
 */
async function bigRequest(request: BigRequest, reader?: BigWigReader, googleProject?: string): Promise<BigResponse> {

    // create reader if necessary
    if (reader === undefined) {
        const loader = dataLoaderForArgs(request.url, googleProject);
        reader = new BigWigReader(loader);
    }
    const header = await reader!.getHeader();

    const zoomLevelIndex = getClosestZoomLevelIndex(request.zoomLevel, header.zoomLevelHeaders);
    let read: Promise<BigResponseData>;
    if (FileType.TwoBit === header.fileType) {
        read =  request.oneHotEncodedFormat ? readTwoBitDataMatrix(request, reader) : readTwoBitData(request, reader);
    } else if (undefined != zoomLevelIndex) {
        /* can't condense across chromosomes; bigBed will require separate algorithm */
        if (!request.preRenderedWidth || FileType.BigWig !== header.fileType || 
            (request.chr2 && request.chr2 !== request.chr1)) {
            read = reader.readZoomData(request.chr1, request.start, request.chr2 || 
                request.chr1, request.end, zoomLevelIndex);
        } else {
            read = condensedZoomData(await reader.readZoomData(request.chr1, request.start, 
                request.chr1, request.end, zoomLevelIndex), request.preRenderedWidth!, request);
        }
    } else if (FileType.BigWig === header.fileType) {
        let data = reader.readBigWigData(request.chr1, request.start, request.chr2 || request.chr1, request.end);
        if (!request.preRenderedWidth){
            read = data;
        } else {
            read = condensedData(await data, request.preRenderedWidth!, request);
        }
    } else {
        read = reader.readBigBedData(request.chr1, request.start, request.chr2 || request.chr1, request.end);
    }
    return wrapRequest(read);
}

/**
 * Get a zoomLevelIndex for the request.zoomLevel
 * Finds the index for the closest zoomLevelHeader by reductionLevel without going over.
 *
 * @param zoomLevel zoomLevel from the request.
 * @param zoomLevelHeaders ZommLevelHeaders from BigWigReader's BigWigHeader.zoomLevelHeaders.
 */
function getClosestZoomLevelIndex(zoomLevel: number | undefined, zoomLevelHeaders?: ZoomLevelHeader[]): number | undefined {
    if (undefined == zoomLevel || undefined == zoomLevelHeaders) {
        return undefined;
    }
    let zoomLevelIndex: number | undefined;
    let highestReduction: number | undefined;
    for (let zoomLevelHeader of zoomLevelHeaders) {
        if (zoomLevelHeader.reductionLevel > zoomLevel) {
            continue;
        }
        if (undefined == highestReduction || highestReduction < zoomLevelHeader.reductionLevel) {
            highestReduction = zoomLevelHeader.reductionLevel;
            zoomLevelIndex = zoomLevelHeader.index;
        }
    }
    return zoomLevelIndex;
}

export const bigQueries = { bigRequests };
export const bigResolvers = {
    BigResponseData: passThroughScalar("BigResponseData",
        "Generic BigResponse object; may contain BigBed, BigWig, or BigZoom data"),
    TwoBitData: {
        async __resolveReference(reference: {chrom: string, start: number, end: number, url: string, googleProject?: string}) {
            return getTwoBitData({ chrom: reference.chrom, start: reference.start, end: reference.end, url: reference.url, googleProject: reference.googleProject})
        }
    },    
    BigResponseWithRange: {
            __resolveReference(reference: { chrom: string; start: number; end: number; url: string }) {
                const readers: { [url: string]: BigWigReader } = [reference.url].reduce(
                    (map: { [url: string]: BigWigReader }, url: string): { [url: string]: BigWigReader } => ({
                        ...map,
                        [url]: new BigWigReader(dataLoaderForArgs(url))
                    }),
                    {}
                );
                return wrapRequestWithInput(bigRequest(
                    {
                        url: reference.url,
                        chr1: reference.chrom,
                        start: reference.start,
                        end: reference.end
                    },
                    readers[reference.url]
                ), reference.chrom, reference.start,  reference.end, reference.url);
            }
        }
       
};
