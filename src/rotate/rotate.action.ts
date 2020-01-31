import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@microsoft/ts-command-line';
import { existsSync, readFileSync } from 'fs';
import { AccessConfig } from '../config';
import { AwsRotator } from '../credientals/aws.cred';
import { setSecret, getPublicKey } from '../github';
import { Logger } from '../log';

const ONE_HOUR = 60 * 60 * 1000;
export class ActionRotate extends CommandLineAction {
    private config?: CommandLineStringParameter;
    private profile?: CommandLineStringParameter;
    private commit?: CommandLineFlagParameter;
    private force?: CommandLineFlagParameter;

    public constructor() {
        super({
            actionName: 'rotate',
            summary: 'Rotate Secrete keys',
            documentation: 'Rotate access keys inside Github actions and AWS',
        });
    }

    protected async onExecute(): Promise<void> {
        if (this.config?.value == null) {
            throw new Error('Missing configuration');
        }
        if (!existsSync(this.config.value)) {
            throw new Error('Configuration file is missing');
        }
        const config = AccessConfig.load(readFileSync(this.config.value));

        let profileNames = [];
        if (this.profile?.value) {
            const profile = config.profiles[this.profile.value];
            if (profile == null) {
                throw new Error(`Configuration: profile "${this.profile.value}" not found`);
            }
            profileNames.push(this.profile.value);
        } else {
            profileNames = Object.keys(config.profiles);
        }

        for (const profileName of profileNames) {
            const profile = config.profiles[profileName];
            const rotator = new AwsRotator(profileName, profile.user);
            const childLogger = Logger.child({ profile: profileName, user: profile.user });

            if (profile.user == null) {
                childLogger.error('Profile: is missing user');
                continue;
            }

            if (isNaN(profile.maxAge) || profile.maxAge < 1) {
                childLogger.error({ maxAge: profile.maxAge }, 'Profile: Invalid max age');
                continue;
            }

            childLogger.info({ profile: profileName, user: profile.user }, 'RotatingProfile');
            const accessKeyInfo = await rotator.getInfo(childLogger);
            if (accessKeyInfo == null) {
                childLogger.info({ profile: profileName }, 'NoAccessKeys');
            } else {
                const dateDiff = Date.now() - accessKeyInfo.date.getTime();
                if (dateDiff < profile.maxAge * ONE_HOUR && this.force?.value != true) {
                    childLogger.info(
                        { profile: profileName, lastRotated: accessKeyInfo.date },
                        `Rotated less than ${profile.maxAge} hours ago`,
                    );
                    continue;
                }
                if (dateDiff < profile.maxAge * ONE_HOUR && this.force?.value != true) {
                    childLogger.debug({ dateDiff }, 'ForcedRotation');
                }
                childLogger.info({ profile: profileName, lastRotated: accessKeyInfo.date }, 'Rotating..');
            }

            const repositories = config.getRepositories(profileName);
            if (repositories.length == 0) {
                childLogger.warn({ profile: profileName }, 'No repositories found');
                continue;
            }

            childLogger.info('CreatingNewAccessKey');

            for (const repo of repositories) {
                childLogger.info(
                    {
                        repo: repo.repoName,
                        secrets: { accessKey: repo.accessKey, secretAccessKey: repo.secretAccessKey },
                    },
                    'SetSecrets',
                );

                if (this.commit?.value) {
                    // Validate access to the repo
                    await getPublicKey(repo.repoName, childLogger);

                    const newAccessKey = await rotator.newKey(childLogger);

                    await setSecret(repo.repoName, repo.accessKey, newAccessKey?.id, childLogger);
                    await setSecret(repo.repoName, repo.secretAccessKey, newAccessKey?.secret, childLogger);
                }
            }

            if (accessKeyInfo) {
                childLogger.warn('Removing old access Key');
                if (this.commit?.value) {
                    rotator.remove(accessKeyInfo.id, childLogger);
                }
            }
            if (this.commit?.value == null) {
                childLogger.warn('DryRun Done, use --commit to rotate');
            }
        }
    }

    protected onDefineParameters(): void {
        this.config = this.defineStringParameter({
            argumentName: 'CONFIG',
            parameterLongName: '--config',
            description: 'Config to use',
            required: true,
        });

        this.profile = this.defineStringParameter({
            argumentName: 'PROFILE',
            parameterLongName: '--profile',
            description: 'Profile to rotate',
            required: false,
        });

        this.commit = this.defineFlagParameter({
            parameterLongName: '--commit',
            description: 'Begin the rotation',
            required: false,
        });

        this.force = this.defineFlagParameter({
            parameterLongName: '--force',
            description: 'Force a rotation',
            required: false,
        });
    }
}
