import { parseRawIndexRefData, blocksForRange, BamHeader, BamIndexRefData, BamAlignment } from "genomic-reader";

const apiUrl = "http://localhost:3000";
const bamUrl = "http://localhost:8001/test.bam";
const baiUrl = "http://localhost:8001/test.bam.bai";

const chr = "chr22";
const start = 20_890_000;
const end = 20_910_000;

async function main() {
    // Step 1: Get BAM Header
    console.log("Step 1: Fetching BAM header...");
    const headerResponse = await fetch(`${apiUrl}/bamHeader`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bamUrl })
    });
    if (!headerResponse.ok) {
        throw new Error(`Header request failed: ${headerResponse.status} ${await headerResponse.text()}`);
    }
    const header = (await headerResponse.json()) as BamHeader;
    const refId = header.chromToId[chr];
    console.log("Header received. refId for", chr, ":", refId);

    // Step 2: Get BAM Index for the chromosome
    console.log("\nStep 2: Fetching BAM index for refId", refId, "...");
    const indexResponse = await fetch(`${apiUrl}/bamIndex`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baiUrl, refId })
    });
    if (!indexResponse.ok) {
        throw new Error(`Index request failed: ${indexResponse.status} ${await indexResponse.text()}`);
    }
    const indexBuffer = await indexResponse.arrayBuffer();
    const indexData: BamIndexRefData = parseRawIndexRefData(indexBuffer);
    console.log("Index received. Linear index length:", indexData.linearIndex.length);

    // Step 3: Get chunks for the range
    console.log("\nStep 3: Calculating chunks for range", start, "-", end, "...");
    const chunks = blocksForRange(indexData, start, end);
    console.log("Chunks:", chunks);

    // Step 4: Get BAM data
    console.log("\nStep 4: Fetching BAM data...");
    const bamResponse = await fetch(`${apiUrl}/bam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bamUrl, refId, chr, start, end, chunks })
    });
    if (!bamResponse.ok) {
        throw new Error(`BAM request failed: ${bamResponse.status} ${await bamResponse.text()}`);
    }
    const alignments = (await bamResponse.json()) as BamAlignment[];
    console.log("\nAlignment count:", alignments.length);
    console.log("Alignments:", alignments);
}

main().catch(console.error);
