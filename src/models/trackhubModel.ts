export interface Genomes {
    genome: string;
    trackDB: string;
    defaultPos?: string;
}

export interface TrackHubGenomes {
    trackhubname?: string;
    genomes: Genomes[];
}

export interface TrackHub {
    trackhubname?: string;
    trackHubContent: string;
}

export interface trackHubUrl {
    trackHubUrl: string;
    hubUrl?: boolean;
}

export type trackHubResponse = TrackHubGenomes | TrackHub;
