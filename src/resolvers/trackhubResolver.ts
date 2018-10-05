import Axios from "axios";
import { Genomes, TrackHubGenomes, trackHubUrl, trackHubResponse, TrackHub } from "../models/trackhubModel";

function resolveTrackHubType(obj: any): string {
    if (obj.genomes) {
        return "TrackHubGenomes";
    } else {
        return "TrackHub";
    }
}

/**
 * Apollo server graphql resolver for trackHub requests.
 *
 * @param obj Unused. Needed by Apollo server resolver function signature.
 */
async function trackHubRequests(obj: any, trackHubUrl: trackHubUrl | any): Promise<trackHubResponse> {
    let shortLabel: string;
    //hubUrl : Fetch hub Genomes when true otherwise fetch hub content of respective genome
    if (trackHubUrl.trackhuburl.hubUrl) {
        let result: any;
        result.data = await Axios.get(trackHubUrl.trackhuburl.trackHubUrl);
        const lines = result.data.split("\n");
        //ShortLabel
        const shortLabelLine = lines.find((l: string) => l.startsWith("shortLabel"))!;
        shortLabel = shortLabelLine
            .split(" ")
            .slice(1)
            .join(" ");
        const genomeLine = lines.find((l: string) => l.startsWith("genomesFile"))!;
        let url;
        const genomeFile = genomeLine.split(" ")[1];
        if (genomeFile.startsWith("http")) {
            url = genomeFile;
        } else {
            const i = trackHubUrl.trackhuburl.trackHubUrl.lastIndexOf("/");
            url = trackHubUrl.trackhuburl.trackHubUrl.substr(0, i) + "/" + genomeFile; // genome url
        }
        let hubGenomes: any;
        hubGenomes.data = await Axios.get(url);
        const gen: Genomes[] = [];
        let trackHubGenome: TrackHubGenomes = {} as {
            trackhubname?: string;
            genomes: Genomes[];
        };
        let ge: any = {};
        const genomesLines = hubGenomes.data.split("\n");
        let error = false;
        for (const g of genomesLines) {
            if (g.startsWith("#")) {
                continue;
            }
            if (g === "") {
                if (Object.keys(ge).length > 0) {
                    if (!error) {
                        gen.push(ge as any);
                        ge = {};
                    } else {
                        error = false;
                    }
                }
                continue;
            }
            const l = g.trim();
            if (l.indexOf(" ") === -1) {
                error = true;
                continue;
            }
            const key = l.split(" ")[0] && l.split(" ")[0].trim();
            const val = l.split(" ")[1] && l.split(" ")[1].trim();
            ge[key] = val;
        }
        if (Object.keys(ge).length > 0) {
            if (!error) {
                gen.push(ge as any);
            }
        }
        trackHubGenome.genomes = gen;
        trackHubGenome.trackhubname = shortLabel;
        return trackHubGenome;
    } else {
        let hubResponse: any;
        hubResponse.data = await Axios.get(trackHubUrl.trackhuburl.trackHubUrl);
        let trackHubContent: TrackHub = {} as {
            trackHubContent: string;
        };
        trackHubContent.trackhubname = trackHubUrl.trackhuburl.trackHubUrl;
        trackHubContent.trackHubContent = hubResponse.data;
        return trackHubContent;
    }
}

export const trackHubResolvers = {
    Query: {
        trackHubRequests
    },
    trackHubResponse: {
        __resolveType: resolveTrackHubType
    }
};
