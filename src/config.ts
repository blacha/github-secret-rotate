export interface AccessKeyConfig {
    profiles: Record<string, AccessKeyConfigProfile>;
    repositories: Record<string, AccessKeyConfigRepositories[]>;
}

export interface AccessKeyConfigProfile {
    /** IAM username that holds the access keys */
    user: string;

    /** Number of hours that a access key is allowed to be old */
    maxAge: number;
}

export interface AccessKeyConfigRepositories {
    /** Profile to use gain access to keys */
    profile: string;

    /** Secret to use for access key */
    accessKey: string;

    /** Secret use for secret access key */
    secretAccessKey: string;
}

export type AccessKeyConfigUpdate = AccessKeyConfigRepositories & { repoName: string };

export class AccessConfig {
    profiles: Record<string, AccessKeyConfigProfile>;
    repositories: Record<string, AccessKeyConfigRepositories[]>;

    constructor(config: AccessKeyConfig) {
        this.profiles = config.profiles;
        this.repositories = config.repositories;
    }

    getRepositories(profile: string): AccessKeyConfigUpdate[] {
        const output: AccessKeyConfigUpdate[] = [];
        for (const [repo, config] of Object.entries(this.repositories)) {
            for (const cfg of config) {
                if (cfg.profile == profile) {
                    output.push({ ...cfg, repoName: repo });
                }
            }
        }
        return output;
    }

    static load(config: Buffer) {
        const obj = JSON.parse(config.toString());

        if (obj.profiles == null) {
            throw new Error('Configuration: Missing profiles');
        }
        if (obj.repositories == null) {
            throw new Error('Configuration: Missing repositories');
        }

        return new AccessConfig(obj as AccessConfig);
    }
}
