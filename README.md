# Signal Service
A graphql service that does the following:
* Reads data from BigWig and BigBed files in batches.

## API
The following is a complete example graphql query for batching big file requests
```graphql
query BigRequests($bigRequests: [BigRequest!]!) {
    bigRequests(requests: $bigRequests) {
        data,
        error
    }
}
```
Variables will look like this:
```json
{
    "bigRequests": [
        { "url": "http://localhost/sample.bigwig", "chr1": "chr14", "start": 19485000, "end": 20000100 },
        { "url": "http://localhost/sample.bigwig", "chr1": "chr2", "start": 0, "chr2": "chr6", "end": 1000, "zoomLevel": 100 },
        { "url": "http://localhost/sample.bigwig", "chr1": "chr2", "start": 0, "end": 1000000, "zoomLevel": 1000, "onePerPixel": true },
        { "url": "http://localhost/sample.bigbed", "chr1": "chr21", "start": 10000000, "chr2": "chr21", "end": 20000000 }
    ]
};
```

## For contributers

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