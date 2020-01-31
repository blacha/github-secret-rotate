/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as AWS from 'aws-sdk';
import { Logger } from '../log';

export interface AccessKeyInfo {
    user: string;
    id: string;
    date: Date;
}
export type AccessKeySecret = AccessKeyInfo & { secret: string };

export class AwsRotator {
    private iam: AWS.IAM;
    private user: string;

    constructor(profile: string, user: string) {
        const credentials = new AWS.SharedIniFileCredentials({ profile });
        this.iam = new AWS.IAM({ credentials });
        this.user = user;
    }

    async getInfo(log: typeof Logger): Promise<AccessKeyInfo | null> {
        const accessKeys = await this.iam.listAccessKeys({ UserName: this.user }).promise();

        log.debug({ keys: accessKeys.AccessKeyMetadata.map(c => c.AccessKeyId) }, 'AccessKeys');
        for (const accessKey of accessKeys.AccessKeyMetadata) {
            if (accessKey.Status != 'Active') {
                continue;
            }
            log.trace({ user: this.user, date: accessKey.CreateDate }, 'AccessKey');
            return {
                user: this.user,
                id: accessKey.AccessKeyId!,
                date: accessKey.CreateDate!,
            };
        }
        return null;
    }

    _newKey: AccessKeySecret;
    async newKey(log: typeof Logger): Promise<AccessKeySecret> {
        if (this._newKey) {
            return this._newKey;
        }
        const accessKeys = await this.iam.createAccessKey({ UserName: this.user }).promise();
        log.info({ accessKey: accessKeys.AccessKey.AccessKeyId }, 'AccessKeyCreated');
        this._newKey = {
            user: this.user,
            id: accessKeys.AccessKey.AccessKeyId,
            date: new Date(),
            secret: accessKeys.AccessKey.SecretAccessKey,
        };
        return this._newKey;
    }

    async remove(accessKey: string, log: typeof Logger): Promise<void> {
        log.info({ accessKey }, 'AccessKeyDeleted');
        await this.iam.deleteAccessKey({ UserName: this.user, AccessKeyId: accessKey }).promise();
    }
}
