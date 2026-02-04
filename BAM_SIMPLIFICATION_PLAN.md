# BAM API Simplification Plan

## Problem

Current BAM retrieval requires 3 API calls + client-side parsing:

1. `POST /bamHeader` → get `refId` for chromosome
2. `POST /bamIndex` → get raw binary index data, parse with `parseRawIndexRefData`
3. Client calls `blocksForRange()` to get chunks
4. `POST /bam` → get alignments

This forces clients to depend on `genomic-reader` just to parse index data.

## Solution

Add a single `/bamRead` endpoint that handles everything internally using `BamReader`.

### Request

```
POST /bamRead
{
    "bamUrl": "http://example.com/file.bam",
    "baiUrl": "http://example.com/file.bam.bai",  // optional, defaults to bamUrl + '.bai'
    "chr": "chr22",
    "start": 20890000,
    "end": 20910000,
    "googleProject": "..."  // optional, for gs:// URLs
}
```

### Response

```json
[
    { "chr": "chr22", "start": 20890000, "strand": true, "seq": "ACGT...", ... },
    ...
]
```

### Error

- `400 Bad Request` if range > 20,000 bp

## Implementation

### 1. `src/models/bamModel.ts`

Add interface:

```typescript
export interface BamReadRequest {
    bamUrl: string;
    baiUrl?: string;
    chr: string;
    start: number;
    end: number;
    googleProject?: string;
}
```

### 2. `src/routers/bam.ts`

Add handler:

```typescript
import { BamReader } from "genomic-reader";
import { BamReadRequest } from "../models/bamModel";

export async function bamReadHandler(req: express.Request, res: express.Response) {
    const { bamUrl, baiUrl, chr, start, end, googleProject } = req.body as BamReadRequest;
    
    if (end - start > 20_000) {
        res.status(400).send("Invalid base pair length. Only ranges < 20000 bp supported.");
        return;
    }
    
    const bamLoader = dataLoaderForArgs(bamUrl, googleProject);
    const baiLoader = dataLoaderForArgs(baiUrl || `${bamUrl}.bai`, googleProject);
    
    const reader = new BamReader(bamLoader, baiLoader);
    const alignments = await reader.read(chr, start, end);
    
    res.send(alignments);
}
```

### 3. `src/routers/index.ts`

Add route:

```typescript
.post('/bamRead', bamReadHandler)
```

## Backward Compatibility

Keep existing endpoints (`/bamHeader`, `/bamIndex`, `/bam`) for clients that depend on them.
