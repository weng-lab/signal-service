import * as express from "express";
import { streamRawBamIndex, readBamHeaderData, readBam } from "genomic-reader"
import { BamHeaderRequest, BamIndexRequest, BamRequest } from "../models/bamModel";
import { dataLoaderForArgs } from "../util";

export async function bamHeaderHandler(req: express.Request, res: express.Response) {
    const bamHeaderRequest = req.body as BamHeaderRequest;
    const bamLoader = dataLoaderForArgs(bamHeaderRequest.bamUrl, bamHeaderRequest.googleProject);
    const bamHeader = await readBamHeaderData(bamLoader);
    res.send(bamHeader);
}

export async function bamIndexHandler(req: express.Request, res: express.Response) {
    const bamIndexRequest = req.body as BamIndexRequest;
    const baiLoader = dataLoaderForArgs(bamIndexRequest.baiUrl, bamIndexRequest.googleProject);
    const rawBamReadable = await streamRawBamIndex(baiLoader, bamIndexRequest.refId);
    res.setHeader("Content-Type", "application/octet-stream");
    rawBamReadable.on('data', (d: ArrayBuffer) => {
        res.write(Buffer.from(d));
    });
    rawBamReadable.on('end', () => res.end());
}

export async function bamHandler(req: express.Request, res: express.Response) {
    const bamRequest = req.body as BamRequest;
    if (bamRequest.end - bamRequest.start > 20_000) {
        res.status(400).send("Invalid base pair length. Only ranges < 20000 bp supported.");
        return;
    }
    const bamLoader = dataLoaderForArgs(bamRequest.bamUrl, bamRequest.googleProject);
    const bamData = await readBam(bamLoader, bamRequest.chunks, bamRequest.refId, 
        bamRequest.chr, bamRequest.start, bamRequest.end);
    res.send(bamData);
}