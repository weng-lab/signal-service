# Signal Service
A graphql service that does the following:
* Reads data from BigWig and BigBed files in batches.

## API
The following is a complete example graphql query for batching big file requests
```graphql
query BigRequests($bigRequests: [BigRequest!]!) {
    bigRequests(requests: $bigRequests) {
        data {
            chr, start, end
            ... on BigWigData {
                value
            }
            ... on BigZoomData {
                validCount, sumData, sumSquares, minVal, maxVal
            }
            ... on BigBedData {
                name, score, strand, cdStart, cdEnd, color
                exons { 
                    start, end 
                }
            }
        }
        error
    }
}
```
Variables will look like this:
```json
{
    "bigRequests": [
        { "url": "http://localhost/sample.bigwig", "chr1": "chr14", "start": 19485000, "end": 20000100 },
        { "url": "http://localhost/sample.bigwig", "chr1": "chr2", "start": 0, "chr2": "chr6", "end": 1000, "zoomLevel": 100 }
        { "url": "http://localhost/sample.bigbed", "chr1": "chr21", "start": 10000000, "chr2": "chr21", "end": 20000000 }
    ]
};
```

## For contributers

### Building
* Run `yarn install` to install dependencies.
* Run `yarn build` to build.

### Testing
You must have Node.js and docker-compose installed. 
* `scripts/test.sh` to run automated tests.
* `scripts/run-dependencies.sh` to stand up a web server to host static sample BigWig and BigBed files. `scripts/test.sh` runs this for you.
* `scripts/stop-dependencies.sh` to stop bring down the server.