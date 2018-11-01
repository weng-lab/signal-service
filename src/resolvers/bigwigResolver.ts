import { GraphQLScalarType } from "graphql";
import { AxiosDataLoader, BigWigReader, HeaderData, FileType, ZoomLevelHeader } from "bigwig-reader";
import { BigResponse, BigResponseData, BigRequest, BigZoomData } from "../models/bigwigModel";

/**
 * Apollo server graphql resolver for batched bigwig / bigbed data requests.
 *
 * @param obj Unused. Needed by Apollo server resolver function signature.
 */
async function bigRequests(obj: any, { requests }: { requests: Array<BigRequest> } | any): Promise<BigResponse[]> {
    return Promise.all(requests.map((request: BigRequest) => bigRequest(request)));
}

/**
 * Creates a proimse for condensing zoomed bigWig data to return exactly one element per pixel.
 *
 * @param data the zoom data returned by the bigWig reader
 * @param request the request, containing coordinates and number of basepairs per pixel
 */
async function condensedZoomData(pdata: Promise<BigZoomData[]>, request: BigRequest): Promise<BigZoomData[]> {

    let data: BigZoomData[] = await pdata;
    let bin: (coord: number) => number = (coord) => (Math.floor((coord - request.start) / request.zoomLevel!));
    let dataout: BigZoomData[] = [];

    /* create one empty result datapoint per pixel */
    for (let i = request.start; i < request.end; i += request.zoomLevel!) {
	dataout.push({
	    chr: request.chr1,
	    start: i,
	    end: i + request.zoomLevel! - 1,
	    minVal: Infinity,
	    maxVal: -Infinity
	});
    }

    /* step through datapoints; add values to appropriate pixels */
    for (let datapoint of data) {
	for (let i = datapoint.start; i < datapoint.end; ++i) {
	    const ibin = bin(i);
	    if (!dataout[ibin]) { continue; } // some datapoints will be out of range
	    if (dataout[ibin].minVal > datapoint.minVal) { dataout[ibin].minVal = datapoint.minVal; }
	    if (dataout[ibin].maxVal < datapoint.maxVal) { dataout[ibin].maxVal = datapoint.maxVal; }
	}
    }

    /* filter any without data; if minVal was set, maxVal must have been set */
    return dataout.filter(datapoint => datapoint.minVal !== Infinity);

}

/**
 * Creates a Promise for processing a single BigRequest.
 *
 * @param request the BigRequest to handle.
 */
async function bigRequest(request: BigRequest): Promise<BigResponse> {
    const loader = new AxiosDataLoader(request.url);
    const reader = new BigWigReader(loader);
    const header: HeaderData = await reader.getHeader();
    const zoomLevelIndex = getClosestZoomLevelIndex(request.zoomLevel, header.zoomLevelHeaders);
    let read: () => Promise<BigResponseData>;
    if (undefined != zoomLevelIndex) {
        read = () => {

	    /* can't condense across chromosomes; bigBed will require separate algorithm */
	    if (!request.onePerPixel || FileType.BigWig !== header.fileType || (request.chr2 && request.chr2 !== request.chr1)) {
		return reader.readZoomData(request.chr1, request.start, request.chr2 || request.chr1, request.end, zoomLevelIndex);
	    }
	    
            return condensedZoomData(reader.readZoomData(request.chr1, request.start, request.chr1, request.end, zoomLevelIndex), request);
	    
        };
    } else if (FileType.BigWig === header.fileType) {
        read = () => {
            return reader.readBigWigData(request.chr1, request.start, request.chr2 || request.chr1, request.end);
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
        response.error = e.message;
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
