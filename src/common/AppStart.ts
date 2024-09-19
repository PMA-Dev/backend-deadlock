import dotenv from 'dotenv';
import { FetchEnvFromAkv } from './FetchEnvFromAkv';
import { Logger } from './Logger';
import path from 'path';
import { CommonConfig, CommonConfigKeys } from './CommonConfig';

const config = new CommonConfig();

export const setup = async () => {
    await rawSetup(async (logger: Logger) => {
        const shouldUseFile = await FetchEnvFromAkv();
        if (shouldUseFile) {
            // Load environment variables from .env after AKV
            let dotenvPath = path.resolve(
                __dirname,
                config.getByKey(CommonConfigKeys.LOADED_DOTENV_PATH)
            );

            logger.verbose(
                `Loading environment variables from ${dotenvPath}...`
            );
            dotenv.config({ path: dotenvPath });
        }
    });
};

export const rawSetup = async (
    postLoad?: (logger: Logger) => Promise<void>
) => {
    const logger = new Logger().setup(__filename, true);
    try {
        // print out all filenames in this dir and the above one
        const fs = require('fs');
        fs.readdirSync(__dirname).forEach((file: string) => {
            logger.verbose(`Found file: ${file}`);
        });

        // Clear all existing process env vars
        logger.verbose('Clearing existing environment variables...');
        Object.keys(process.env).forEach((key) => {
            delete process.env[key];
        });

        // try to load environment variables from local.env first
        const localEnvPath = path.resolve(__dirname, '../../local.env');
        logger.verbose(`Loading environment variables from ${localEnvPath}...`);
        dotenv.config({ path: localEnvPath });

        // if a 'embeddedEnv.ts' file exists, load it as well
        const loadEmbeddedEnv = (pathName: string) => {
            const embeddedEnvPath = path.resolve(__dirname, pathName);
            // embeddedEnv is a module that exports an object with environment variables so just import and use, try catch with it too
            try {
                const { embeddedEnv } = require(embeddedEnvPath);
                Object.entries(embeddedEnv).forEach(([key, value]) => {
                    process.env[key] = value ? (value as string) : '';
                });
                logger.verbose(
                    `Loaded environment variables from ${embeddedEnvPath}.`
                );
            } catch (error) {
                logger.error(
                    `No embedded environment variables found at ${embeddedEnvPath}.`
                );
            }
        };
        loadEmbeddedEnv('./EmbeddedEnv.js');
        loadEmbeddedEnv('./EmbeddedEnv.ts');

        // Load environment variables from Azure Key Vault (AKV)
        logger.verbose(
            'Fetching and loading environment variables from Azure Key Vault...'
        );

        if (!!postLoad) {
            await postLoad(logger);
        }

        logger.info('Environment variables have been set successfully.');
    } catch (error) {
        logger.error(
            'Failed to fetch or load environment variables from AKV:',
            error
        );
        throw error; // Re-throw the error after logging it
    }
};
