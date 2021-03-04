import { GraphQLScalarType } from "graphql";
import { DataLoader, AxiosDataLoader } from "genomic-reader";
import { ResponseWithError } from "../models/commonModel";
import { GoogleBucketDataLoader } from "bigwig-reader-gcp"

export function dataLoaderForArgs(url: string, googleProject?: string): DataLoader {
    if (url.startsWith("gs://")) {
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

export async function wrapRequest<T>(read: () => Promise<T>): Promise<ResponseWithError<T>> {
    const response: ResponseWithError<T> = {};
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
