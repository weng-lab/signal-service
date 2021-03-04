import * as express from "express";
import { Readable } from "stream";
import { BigRequest } from "../models/bigwigModel";
import { FileType, HeaderData, BigWigReader, ZoomLevelHeader } from "genomic-reader";
import { dataLoaderForArgs, MultiplexedResponseStreamer } from "../util";

export async function bigHandler(req: express.Request, res: express.Response) {
    const bigRequests = req.body as BigRequest[];
    const streamer = new MultiplexedResponseStreamer(res, 512);
    const bigPromises: Promise<void>[] = bigRequests.map((bigRequest: BigRequest, index: number) => {
        return handleBigRequest(bigRequest, index, streamer);
    });
    await Promise.all(bigPromises);

    res.end();
}

async function handleBigRequest(bigRequest: BigRequest, index: number, streamer: MultiplexedResponseStreamer): Promise<void> {
    const loader = dataLoaderForArgs(bigRequest.url, bigRequest.googleProject);
    const reader = new BigWigReader(loader);
    const header: HeaderData = await reader.getHeader();
    const zoomLevelIndex = getClosestZoomLevelIndex(bigRequest.zoomLevel, header.zoomLevelHeaders);
    let stream: Readable;
    if (FileType.TwoBit === header.fileType) {
        stream = await reader.streamTwoBitData(bigRequest.chr1, bigRequest.start, bigRequest.end, undefined, bigRequest.oneHotEncodedFormat);
    } else if (undefined != zoomLevelIndex) {
        stream = await reader.streamZoomData(bigRequest.chr1, bigRequest.start, bigRequest.chr2 || 
                bigRequest.chr1, bigRequest.end, zoomLevelIndex);
    } else if (FileType.BigWig === header.fileType) {
        stream = await reader.streamBigWigData(bigRequest.chr1, bigRequest.start, bigRequest.chr2 || 
                bigRequest.chr1, bigRequest.end);
    } else {
        stream = await reader.streamBigBedData(bigRequest.chr1, bigRequest.start, bigRequest.chr2 || 
                bigRequest.chr1, bigRequest.end);
    }

    return streamer.pipe(stream, index);
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