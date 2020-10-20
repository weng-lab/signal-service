import { GraphQLScalarType } from "graphql";
import { DataLoader, AxiosDataLoader } from "genomic-reader";
import { GoogleBucketDataLoader } from "bigwig-reader-gcp";
import { ResponseWithError, ResponseWithInput } from "./models/commonModel";
import { Readable } from "stream";
import * as express from "express";

export function dataLoaderForArgs(url: string, googleProject?: string): DataLoader {
    if (googleProject !== undefined && url.startsWith("gs://")) {
        const splitUrl = url.split("gs://")[1].split('/');
        return new GoogleBucketDataLoader(splitUrl[0], splitUrl.slice(1).join('/'), googleProject);
    }
    return new AxiosDataLoader(url);
}

/**
 * Convenience function to create a GraphQLScalarType definition that does not check 
 * or mutate values, only passing them though
 */
export function passThroughScalar(name: string, description: string) {
    return new GraphQLScalarType({
        name: name,
        description: description,
        serialize: value => value,
        parseValue: value => value,
        parseLiteral: value => value
    })
}

export async function wrapRequest<T>(read: Promise<T>): Promise<ResponseWithError<T>> {
    const response: ResponseWithError<T> = {};
    try {
        response.data = await read;
    } catch (e) {
        response.error = {
            errortype: e.errortype,
            message: e.message
        };
    }
    return response;
}

export class MultiplexedResponseStreamer {

    constructor(private response: express.Response, private bufferSize: number = 512) {}

    pipe(stream: Readable, index: number): Promise<void> {

        let buffer: Array<any> = [];

        return new Promise((resolve) => {
            stream.on("data", (chunk: string) => {
                buffer.push(chunk);
                if (buffer.length >= this.bufferSize) {
                    this.writeBuffer(buffer, index);
                    buffer = [];
                }
            });
            stream.on("end", () => {
                if (buffer.length > 0) {
                    this.writeBuffer(buffer, index);
                }
                this.response.write(`${index}:END\n`);
                resolve();
            });
            stream.on("error", (err: Error) => {
                let sanitizedMsg = err.message.replace("\n", "");
                this.response.write(`${index}:ERROR:${sanitizedMsg}`);
                resolve();
            });
        });
    }

    private writeBuffer(buffer: Array<any>, index: number) {
        const value = (typeof buffer[0] === 'object') ? JSON.stringify(buffer) : buffer.join("");
        this.response.write(`${index}:DATA:${value}\n`);
    }

}

export async function wrapRequestWithInput<T>(read: Promise<T>, chrom: string, start: number, end: number, url: string): Promise<ResponseWithInput<T>> {
    const response: ResponseWithInput<T> = { chrom,start,end,url};
    response.data = await read;    
    return response
}
