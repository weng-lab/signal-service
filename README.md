# Signal Service
A graphql service that does the following:
* Reads data from Trackhubs
* Reads data from BigWig and BigBed files in batches.
* Reads signal data from 2-bit files.
* Reads BAM indexes and data

## BigWig / BigBed / 2bit
### Request
For BigWig / BigBed /2bit data, use the `/big` POST endpoint

The body of the request must be a json formatted list of "BigRequests"

Each BigRequest contains a URL and a genomic region consisting of chr1, start, chr2 (optional), end. An optional zoomLevel field is also available to get zoomed data from BigWig and BigBed files.

The following is a complete example request body for batching big file and 2-bit file requests:

Variables will look like this:
```json
[
    { "url": "http://localhost/sample.bigwig", "chr1": "chr14", "start": 19485000, "end": 20000100 },
    { "url": "http://localhost/sample.bigwig", "chr1": "chr2", "start": 0, "chr2": "chr6", "end": 1000, "zoomLevel": 100 },
    { "url": "http://localhost/sample.bigwig", "chr1": "chr2", "start": 0, "end": 1000000, "zoomLevel": 1000 },
    { "url": "http://localhost/sample.bigbed", "chr1": "chr21", "start": 10000000, "chr2": "chr21", "end": 20000000 },
    { "url": "http://localhost/sample.2bit", "chr1": "chr22", "start": 1000000, "end": 1001000 }
]
```

### Response
The response is streamed back and multiplexed. Chunks of data are added in the order they are received. As such, each chunk of data starts with the index of it's request. Similar signals are used for indicating the end for a stream or error for a single file.

- BigWig, BigBed, and Zoom data chunks will be in JSON format (See `src/models/bigwigModel.ts`). 
- 2bit data chunks will be strings.

```
0:DATA:{"chr": "chr14", "start": 19_485_969, "end": 19_485_974, "value": 1}
2:DATA:{...}
1:DATA:AAAACTCAG...
...
1:END
0:DATA:{...}
0:END
2:ERROR:Some error message
```

## Trackhubs
Trackhub Requests use the `/graphql` endpoint

```graphql
query trackHubRequests($url: trackHubUrl!) {
    trackHubRequests(trackhuburl: $url)  {
        trackhubname
        ... on TrackHubGenomes {          
            genomes{
                trackDb
                defaultPos
                genome
            }
        }  
        ... on TrackHub {
            trackHubContent
        }
   }
}
```

and corresponding variables json

```json
{
    "url": { "trackHubUrl": "http://localhost:8001/hub.txt", "hubUrl": true }
}
```

## BAMs
BAMs work a little differently. Since BAM indexes are only useful if read in their entirety, we have created a separate request for bam index data (for a single chromosome). Then, using the bigwig-reader library, use the index to find a file block use when requesting BAM data.

### BAM Header Request
First, in order to get reference IDs needed in BAM Index and BAM Data requests, we need to make a BAM Header request. 

Use a POST on `/bamHeader` with a JSON formatted body similar to `{ "bamUrl": "http://someUrl/test.bam" }`

The response will be a json object containing a map of chromosome names to reference ids called `chromToId`

### BAM Index Request
Next, we will request the raw index data for a single chromosome (by referenceId).

Use a POST on `/bamIndex` with a json formatted body similar to 
`{ "baiUrl": "http://someUrl/test.bai", "refId": 1 }`

The response will be raw binary bai data. You can use the `bigwig-reader` library to parse it using 
the provided `parseRawIndexRefData` function.

### BAM Data Request
Finally, we will request bam data for a genomic region.

Use a POST on `/bam` with a JSON formatted body similar to the following
```json
{
    "bamUrl": "http://someUrl/test.bam", 
    "refId": 1, 
    "chr": "chr14", 
    "start": 100000, 
    "end": 100100,
    "chunks": ...
}
```

In the example above, `chunks` is a set of file locations we get from the index. You can use the `bigwig-reader` library's function `blocksForRange` to get these values.

For a complete example of using the bam interface, see `test/bam.test.ts`

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
