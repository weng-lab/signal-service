export interface ResponseWithError<T> {
    data?: T;
    error?: RequestError;
}

export interface RequestError {
    errortype: string;
    message: string;
}