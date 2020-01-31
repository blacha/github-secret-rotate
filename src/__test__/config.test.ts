import { AccessKeyConfig } from '../config';

export const BaseConfig: AccessKeyConfig = {
    profiles: {
        'project-dev': {
            user: 'ci',
            maxAge: 5,
        },
    },
    repositories: {
        'owner/project': [
            {
                profile: 'project-dev',
                accessKey: 'PROJ_ACCESS_KEY',
                secretAccessKey: 'PROJ_SECRET_ACCESS_KEY',
            },
            {
                profile: 'project-prod',
                accessKey: 'PROJ_ACCESS_KEY_PROD',
                secretAccessKey: 'PROJ_SECRET_ACCESS_KEY_PROD',
            },
        ],
    },
};
