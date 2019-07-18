import { GraphQLScalarType } from "graphql";
import { AxiosDataLoader, GoogleBucketDataLoader, BigWigReader, HeaderData, FileType, ZoomLevelHeader } from "bigwig-reader";
import { BigResponse, BigResponseData, BigRequest, BigZoomData, PreRenderedBigWigData, BigWigData } from "../models/bigwigModel";

/**
 * Apollo server graphql resolver for batched bigwig / bigbed data requests.
 *
 * @param obj Unused. Needed by Apollo server resolver function signature.
 */
async function bigRequests(obj: any, { requests }: { requests: Array<BigRequest> } | any): Promise<BigResponse[]> {
    return Promise.all(requests.map((request: BigRequest) => bigRequest(request)));
}

function getDomain(values: { start: number, end: number }[]): { start: number, end: number } {
    let domain: { start: number, end: number } = { start: Infinity, end: -Infinity };
    values.forEach( (value: { start: number, end: number }): void => {
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
 * Creates a proimse for condensing zoomed bigWig data to return exactly one element per pixel.
 *
 * @param data the zoom data returned by the bigWig reader
 * @param request the request, containing coordinates and number of basepairs per pixel
 */
async function condensedData(data: BigWigData[], preRenderedWidth: number, request?: BigRequest): Promise<PreRenderedBigWigData[]> {

    let domain: { start: number, end: number } = request ? { start: request!.start, end: request!.end } : getDomain(data);
    let x: (i: number) => number = i => (i - domain.start) * preRenderedWidth / (domain.end - domain.start);
    
    let cbounds: { start: number, end: number } = { start: Math.floor(x(domain.start)), end: Math.floor(x(domain.end)) };
    let retval = initialPreRenderedValues(cbounds);
    
    data.forEach( (point: BigWigData): void => {
	let cxs: number = Math.floor(x(point.start < domain.start ? domain.start : point.start));
	let cxe: number = Math.floor(x(point.end > domain.end ? domain.end : point.end));
	if (point.value < retval[cxs].min)
	    retval[cxs].min = point.value;
	if (point.value > retval[cxs].max)
	    retval[cxs].max = point.value;
        for (let i: number = cxs + 1; i <= cxe; ++i) {
	    retval[i].min = point.value;
	    retval[i].max = point.value;
	}
    });
    return retval;

}

/**
 * Creates a proimse for condensing zoomed bigWig data to return exactly one element per pixel.
 *
 * @param data the zoom data returned by the bigWig reader
 * @param request the request, containing coordinates and number of basepairs per pixel
 */
async function condensedZoomData(data: BigZoomData[], preRenderedWidth: number, request?: BigRequest): Promise<PreRenderedBigWigData[]> {

    let domain: { start: number, end: number } = request ? { start: request!.start, end: request!.end } : getDomain(data);
    let x: (i: number) => number = i => (i - domain.start) * preRenderedWidth / (domain.end - domain.start);
    
    let cbounds: { start: number, end: number } = { start: Math.floor(x(domain.start)), end: Math.floor(x(domain.end)) };
    let retval = initialPreRenderedValues(cbounds);

    data.forEach( (point: BigZoomData): void => {
	let cxs: number = Math.floor(x(point.start < domain.start ? domain.start : point.start));
	let cxe: number = Math.floor(x(point.end > domain.end ? domain.end : point.end));
	if (point.minVal < retval[cxs].min)
	    retval[cxs].min = point.minVal;
	if (point.maxVal > retval[cxs].max)
	    retval[cxs].max = point.maxVal;
        for (let i: number = cxs + 1; i <= cxe; ++i) {
	    retval[i].min = point.minVal;
	    retval[i].max = point.maxVal;
	}
    });
    return retval;

}

/**
 * Creates a Promise for processing a single BigRequest.
 *
 * @param request the BigRequest to handle.
 */
async function bigRequest(request: BigRequest): Promise<BigResponse> {
    const loader = request.url.startsWith("gs://") ? (
	new GoogleBucketDataLoader(
	    request.url.split("gs://")[1].split('/')[0],
	    request.url.split("gs://")[1].split('/').slice(1).join('/'),
	    request.googleProject
	)
    ) : new AxiosDataLoader(request.url);
    const reader = new BigWigReader(loader);
    const header: HeaderData = await reader.getHeader();
    const zoomLevelIndex = getClosestZoomLevelIndex(request.zoomLevel, header.zoomLevelHeaders);
    let read: () => Promise<BigResponseData>;
    if (FileType.TwoBit === header.fileType) {
	read = async () => {
	    return [ await reader.readTwoBitData(request.chr1, request.start, request.end) ];
	};
    } else if (undefined != zoomLevelIndex) {
        read = async () => {

	    /* can't condense across chromosomes; bigBed will require separate algorithm */
	    if (!request.preRenderedWidth || FileType.BigWig !== header.fileType || (request.chr2 && request.chr2 !== request.chr1)) {
		return reader.readZoomData(request.chr1, request.start, request.chr2 || request.chr1, request.end, zoomLevelIndex);
	    }
	    
            return condensedZoomData(await reader.readZoomData(request.chr1, request.start, request.chr1, request.end, zoomLevelIndex), request.preRenderedWidth!, request);
	    
        };
    } else if (FileType.BigWig === header.fileType) {
        read = async () => {
            let data = reader.readBigWigData(request.chr1, request.start, request.chr2 || request.chr1, request.end);
	    if (!request.preRenderedWidth) return data;
	    return condensedData(await data, request.preRenderedWidth!, request);
        };
    } else {
        read = () => {
            return reader.readBigBedData(request.chr1, request.start, request.chr2 || request.chr1, request.end);
        };
    }
    return readRequest(read);
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

/**
 * Wraps the given read with error handling and creates a response object.
 *
 * @param read Function that attempts to read data.
 */
async function readRequest(read: () => Promise<BigResponseData>): Promise<BigResponse> {
    const response: BigResponse = {};
    try {
        response.data = await read();
    } catch (e) {
        response.error = {
	    errortype: e.errortype,
	    message: e.message
	};
    }
    return response;
}

export const bigwigResolvers = {
    Query: {
        bigRequests
    },
    BigResponseData: new GraphQLScalarType({
	name: "BigResponseData",
	description: "Generic BigResponse object; may contain BigBed, BigWig, or BigZoom data",
	serialize: value => value,
	parseValue: value => value,
	parseLiteral: value => value
    }) // assume that the object is in the correct format and simply pass on
};
