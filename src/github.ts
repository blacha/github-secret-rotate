/* eslint-disable @typescript-eslint/camelcase */
import fetch from 'node-fetch';
import * as Sodium from 'tweetsodium';
import { Logger } from './log';

export const GITHUB_URL = 'https://api.github.com';
const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];
if (GITHUB_TOKEN == null || GITHUB_TOKEN == '') {
    Logger.fatal('$GITHUB_TOKEN is missing');
    process.exit(1);
}

/** Simple wrapper around fetch to inject github auth */
async function request<T>(
    method: 'put' | 'post' | 'get',
    url: string,
    logger: typeof Logger,
    body?: Record<string, any>,
): Promise<T> {
    logger.debug({ method, url }, 'Fetch');
    if (url.startsWith('/')) {
        url = url.substr(1);
    }

    const headers: Record<string, string> = {
        Authorization: `token ${GITHUB_TOKEN}`,
    };

    if (body != null) {
        headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${GITHUB_URL}/${url}`, { method, body: JSON.stringify(body), headers });
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}`);
    }

    // No content needed
    if (res.status == 204) {
        return (null as any) as T;
    }

    return await res.json();
}

const PublicKeys: Map<string, GithubSecretsPublicKey> = new Map();
/**
 * Get github action secret's public key.
 *
 * This is cached for the entire run of the application
 *
 * @param repo repository name eg blacha/github-secret-rotate
 * @param log
 */
export async function getPublicKey(repo: string, log: typeof Logger): Promise<GithubSecretsPublicKey> {
    if (PublicKeys.has(repo)) {
        return PublicKeys.get(repo) as GithubSecretsPublicKey;
    }
    const publicKey = await request<GithubSecretsPublicKey>('get', `/repos/${repo}/actions/secrets/public-key`, log);
    PublicKeys.set(repo, publicKey);
    return publicKey;
}

export interface GithubSecretsPublicKey {
    key_id: number;
    key: string;
}

/**
 * Set a github action secret
 *
 * @param repo repository name eg blacha/github-secret-rotate
 * @param secret name of the secret to set
 * @param value value of the secret
 * @param log logger to use
 */
export async function setSecret(repo: string, secret: string, value: string, log: typeof Logger) {
    const publicKey = await getPublicKey(repo, log);
    const messageBytes = Buffer.from(value);
    const keyBytes = Buffer.from(publicKey.key, 'base64');
    const encryptedBytes = Sodium.seal(messageBytes, keyBytes);
    const encrypted = Buffer.from(encryptedBytes).toString('base64');

    await request('put', `repos/${repo}/actions/secrets/${secret}`, log, {
        encrypted_value: encrypted,
        key_id: publicKey.key_id,
    });
}
