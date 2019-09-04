# Signal Service
A graphql service that does the following:
* Reads data from BigWig and BigBed files in batches.
* Reads signal data from 2-bit files.
* Reads BAM indexes and data

## API
The following is a complete example graphql query for batching big file and 2-bit file requests:
```graphql
query BigRequests($bigRequests: [BigRequest!]!) {
    bigRequests(requests: $bigRequests) {
        data,
        error {
    	    errortype,
	        message
	    }
    }
}
```
where the data field contains a vector of signal data, a vector of peaks, or a single-element vector with a string of sequence data.

Variables will look like this:
```json
{
    "bigRequests": [
        { "url": "http://localhost/sample.bigwig", "chr1": "chr14", "start": 19485000, "end": 20000100 },
        { "url": "http://localhost/sample.bigwig", "chr1": "chr2", "start": 0, "chr2": "chr6", "end": 1000, "zoomLevel": 100 },
        { "url": "http://localhost/sample.bigwig", "chr1": "chr2", "start": 0, "end": 1000000, "zoomLevel": 1000, "onePerPixel": true },
        { "url": "http://localhost/sample.bigbed", "chr1": "chr21", "start": 10000000, "chr2": "chr21", "end": 20000000 },
	    { "url": "http://localhost/sample.2bit", "chr1": "chr22", "start": 1000000, "end": 1001000 }
    ]
};
```

### BAMs
BAMs work a little differently. Since BAM indexes are only useful if read in their entirety, we have created a separate request for
parsed bam index data (for a single chromosome). Then, using the bigwig-reader library, use the index to find a file block use when 
requesting BAM data.

Here's an example of an index request

```graphql
query BamIndexRequests($bamIndexRequests: [BamIndexRequest!]!) {
    bamIndexRequests(requests: $bamIndexRequests) {
        data {
            refId,
            indexRefData
        },
        error {
            errortype,
            message
        }
    }
}
```

and corresponding variables json

```json
{
    "bamIndexRequests": [{ "baiUrl": "http://localhost/sample.bam.bai", "bamUrl": "http://localhost/sample.bam", "chr": "chr22" }]
}
```

To request bam data, the following query may be used

```graphql
query BamRequests($bamRequests: [BamRequest!]!) {
    bamRequests(requests: $bamRequests) {
        data,
        error {
            errortype,
            message
        }
    }
}
```

and the corresponding variables with logic to put it together

```typescript
const baiResponse = ... //response from baiRequest
const start = 10_000_000
const end = 10_010_000
const chunks = blocksForRange(baiResponse.indexRefData, baiResponse.refId, start, end); // function from bigwig-reader
const variables = {
    "bamRequests": [{ bamUrl: "http://localhost/sample.bam", refId: baiResponse.refId, chr: "chr22", start, end, chunks }]
};
```

## For contributors

### Building
* Run `yarn install` to install dependencies.
* Run `yarn build` to compile typescript
* `scripts/build.sh SOME_VERSION` to build docker image and tag it with SOME_VERSION.

### Testing
You must have Node.js and docker-compose installed. 
* `scripts/test.sh` to spin up dependences and run automated tests.
* `yarn test` to run tests without spinning up dependencies.
* `scripts/run-dependencies.sh` to stand up a web server to host static sample BigWig and BigBed files. `scripts/test.sh` runs this for you.
* `scripts/stop-dependencies.sh` to stop bring down the server.

### Deploying
* `scripts/push-image.sh SOME_VERSION` to push docker image tagged with SOME_VERSION to Google Container Registry.
* `scripts/deploy.sh staging SOME_VERSION` to deploy the docker image tagged with SOME_VERSION in GCR to kubernetes in staging environment. 
A list of options will be provided if the second argument is left blank.
