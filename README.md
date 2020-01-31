# Rotate AWS Github actions secret Keys

This script is designed to rotate secret access keys inside github actions secrets

1. Create new AWS access key,
1. Update the github secrets with the new key pair
1. Remove the old access key

## Install

```bash
npm i -g github-secrets-rotate

github-secrets-rotate rotate --config config.json --profile project --commit
```

## Configuration

Everything is configured inside the config json file.

```javascript
{
    // Profiles to use
    "profiles": {
        // AWS Profile name, must exit inside the ~/.aws/config
        "project-dev": {
            // IAM User to use to replace keys
            "user": "ci"
        },
        "project-prod": {
            "user": "ci",
            // Number of hours that a token is allowed to be alive
            "maxAge": 24
        }
    },
    "repositories": {
        /** Github repository */
        "blacha/project": [
            {
                // Profile to use
                "profile": "project-dev",
                // Github secrets names to use for access keys
                "accessKey": "ST_ACCESS_KEY",
                "secretAccessKey": "ST_SECRET_ACCESS_KEY"
            },
            {
                "profile": "project-prod",
                "accessKey": "ST_ACCESS_KEY_PROD",
                "secretAccessKey": "ST_SECRET_ACCESS_KEY_PROD"
            }
        ]
    }
}
```
