# Rotate AWS Github actions secret Keys

[![Build Status](https://github.com/blacha/github-secret-rotate/workflows/Main/badge.svg)](https://github.com/blacha/github-secret-rotate/actions)

This script is designed to rotate secret access keys inside github actions secrets

1. Create new AWS access key,
1. Update the github secrets with the new key pair
1. Remove the old access key

## Install

```bash
npm i -g github-secret-rotate

export GITHUB_TOKEN=abc123

github-secret-rotate rotate --config config.json --profile project --commit
```

## Github token

A personal access token is required it is supplied via the environment variable `GITHUB_TOKEN`

This token needs access to the `repo` scope.

https://developer.github.com/v3/actions/secrets/

## Configuration

Everything is configured inside the config json file.

```javascript
{
    // Profiles to use
    "profiles": {
        // AWS Profile name, must exist inside the ~/.aws/credentials
        "project-dev": {
            // IAM User to use for access keys
            "user": "ci"
            // Number of hours that a token is allowed to be alive
            "maxAge": 200
        },
        // Production example
        "project-prod": {
            "user": "ci",
            "maxAge": 24
        }
    },
    "repositories": {
        /** Github repository */
        "blacha/project": [
            {
                // Configuration profile to use
                "profile": "project-dev",
                // Github secret names to use for access keys
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
