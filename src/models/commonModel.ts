export interface ResponseWithError<T> {
    data?: T;
    error?: RequestError;
}
export interface ResponseWithInput<T> {
    data?: T;
    chrom: string,
    start: number,
    end: number,
    url: string
}

export interface RequestError {
    errortype: string;
    message: string;
}