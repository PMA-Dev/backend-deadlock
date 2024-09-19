import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import readline from 'readline';
import { Logger } from '../common/Logger';

const LOCAL_ENV_FILE_PATH = path.resolve(__dirname, '../../local.env');
const logger = new Logger().setup('script utils');

// Function to update SECRET_FILE_VER in local.env
export const updateLocalEnvVersion = (newVersion: string) => {
    const localEnvConfig = fs.existsSync(LOCAL_ENV_FILE_PATH)
        ? dotenv.parse(fs.readFileSync(LOCAL_ENV_FILE_PATH, 'utf8'))
        : {};

    localEnvConfig.SECRET_FILE_VER = newVersion;

    const updatedLocalEnv = Object.entries(localEnvConfig)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    fs.writeFileSync(LOCAL_ENV_FILE_PATH, updatedLocalEnv, {
        encoding: 'utf8',
    });
    logger.info('Updated SECRET_FILE_VER in local.env to:', newVersion);
};

// Function to compare secret files
export const compareSecretFiles = (oldSecret: string, newSecret: string) => {
    const oldLines = oldSecret.split('\n');
    const newLines = newSecret.split('\n');

    const added = newLines.filter((line) => !oldLines.includes(line));
    const removed = oldLines.filter((line) => !newLines.includes(line));

    return { added, removed };
};

// Function to prompt user for confirmation
export const promptUser = (question: string): Promise<string> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer: string) =>
            resolve(answer.trim().toLowerCase())
        );
    });
};

// Function to merge secrets and save the .env file
export const mergeAndSaveEnv = (
    localEnv: string,
    upstreamSecret: string,
    envFilePath: string
) => {
    const mergedEnv = {
        ...dotenv.parse(upstreamSecret),
        ...dotenv.parse(localEnv),
    };
    const mergedEnvString = Object.entries(mergedEnv)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    fs.writeFileSync(envFilePath, mergedEnvString, { encoding: 'utf8' });
    logger.info('.env file updated with merged secrets.');
};
