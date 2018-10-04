import { bigWigSchema } from "./bigwigSchema";
import { trackHubSchema } from "./trackhubSchema";

//export const schema = bigWigSchema;

// Use the following method when we have more than one schema
import { mergeSchemas } from "graphql-tools";
export const schema = mergeSchemas({ schemas: [bigWigSchema, trackHubSchema] });
