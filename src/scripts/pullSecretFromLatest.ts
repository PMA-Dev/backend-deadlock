import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { getCredential, fetchSecretFromAkv } from '../common/FetchEnvFromAkv';
import { Logger } from '../common/Logger';
import { rawSetup } from '../common/AppStart';
import { compareSecretFiles, mergeAndSaveEnv } from './utils';

const ENV_FILE_PATH = path.resolve(__dirname, '../../.env');
const logger = new Logger().setup(__filename, true);

const executeScript = async () => {
    try {
        logger.info('Starting up raw application...');
        await rawSetup();

        logger.info('Fetching secrets from Azure Key Vault...');
        const credential = getCredential();

        // Fetch the latest secret from Azure Key Vault
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

        // Compare and merge the upstream secret with the current .env file
        const { added, removed } = compareSecretFiles(upstreamSecret, localEnv);

        if (added.length > 0 || removed.length > 0) {
            logger.info('Differences found between upstream and .env files:');
            if (added.length > 0) {
                logger.info('Added lines:', added.join('\n'));
            }
            if (removed.length > 0) {
                logger.info('Removed lines:', removed.join('\n'));
            }

            // Merge the secrets and save the updated .env file
            mergeAndSaveEnv(localEnv, upstreamSecret, ENV_FILE_PATH);
            logger.info('.env file updated with merged secrets.');
        } else {
            logger.info(
                'No differences found between the upstream and .env files. Nothing to update.'
            );
        }
    } catch (error) {
        logger.error('Error during execution:', { error });
        process.exit(1);
    }
};

executeScript();
