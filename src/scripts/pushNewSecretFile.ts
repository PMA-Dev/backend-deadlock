import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import readline from 'readline';
import { getCredential, fetchSecretFromAkv } from '../common/FetchEnvFromAkv';
import { CommonConfig, CommonConfigKeys } from '../common/CommonConfig';
import { Logger } from '../common/Logger';
import { SecretClient } from '@azure/keyvault-secrets';
import { rawSetup } from '../common/AppStart';
import { updateLocalEnvVersion, compareSecretFiles, promptUser } from './utils';

const ENV_FILE_PATH = path.resolve(__dirname, '../../.env');
const logger = new Logger().setup(__filename, true);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const pushNewSecretVersion = async (newSecret: string) => {
    const credential = getCredential();
    const config = new CommonConfig();
    const keyVaultName = config.getByKey(CommonConfigKeys.AKV_NAME);
    const url = `https://${keyVaultName}.vault.azure.net`;
    const client = new SecretClient(url, credential);
    const secretName = config.getByKey(CommonConfigKeys.AKV_SECRET_NAME);

    try {
        const response = await client.setSecret(secretName, newSecret);
        if (!response.properties.version) {
            throw new Error('New secret version not returned.');
        }
        updateLocalEnvVersion(response.properties.version);
        logger.info(
            `New secret version pushed successfully, now at version ${response.properties.version}.`
        );
    } catch (error) {
        logger.error('Failed to push new secret version:', { error });
        throw error;
    }
};

const executeScript = async () => {
    try {
        logger.info('Starting up raw application...');
        await rawSetup();

        logger.info('Starting secret file comparison...');
        const credential = getCredential();

        // Fetch the latest secret from Azure Key Vault using the current version from local.env
        const upstreamSecret = await fetchSecretFromAkv(credential);

        // check if local file exists, if not just pull and save the secret
        if (!fs.existsSync(ENV_FILE_PATH)) {
            logger.info(
                'No .env file found. Creating a new one with the fetched secret.'
            );
            fs.writeFileSync(ENV_FILE_PATH, upstreamSecret, {
                encoding: 'utf8',
            });
            logger.info('.env file created with fetched secret.');
            return;
        }

        // Load the existing .env file
        const localEnv = fs.readFileSync(ENV_FILE_PATH, 'utf8');

        // Compare the upstream secret with the current .env file
        const { added, removed } = compareSecretFiles(upstreamSecret, localEnv);

        if (added.length > 0 || removed.length > 0) {
            logger.info('Differences found between upstream and .env files:');
            if (added.length > 0) {
                logger.info('Added lines:', added.join('\n'));
            }
            if (removed.length > 0) {
                logger.info('Removed lines:', removed.join('\n'));
            }
        } else {
            logger.info(
                'No differences found between the upstream and .env files.'
            );
            process.exit(0);
        }

        const confirmation = await promptUser(
            'Do you want to proceed with updating the secret? (y/n): '
        );
        if (confirmation !== 'y') {
            logger.info('Operation aborted by the user.');
            process.exit(0);
        }

        fs.writeFileSync(ENV_FILE_PATH, localEnv, {
            encoding: 'utf8',
        });
        logger.info('.env file updated with new version.');

        // Push the new version to Azure Key Vault
        await pushNewSecretVersion(localEnv);

        rl.close();
    } catch (error) {
        logger.error('Error during execution:', { error });
        rl.close();
        process.exit(1);
    }
};

executeScript();
