import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../common/Logger';

const logger = new Logger().setup(__filename, true);

// Read the local.env file
const envFilePath = path.resolve(__dirname, '../../local.env');
const envFileContents = fs.readFileSync(envFilePath, 'utf-8');

// Parse the .env file and set environment variables
const envVariables = envFileContents.split('\n').reduce(
    (acc, line) => {
        const [key, value] = line.split('=');
        if (key && value) {
            acc[key.trim()] = value.trim();
        }
        return acc;
    },
    {} as Record<string, string>
);

// Export these variables as a module
const outputFilePath = path.join(__dirname, '../common/EmbeddedEnv.ts');
const outputContents = `export const embeddedEnv = ${JSON.stringify(envVariables, null, 2)};\n`;

fs.writeFileSync(outputFilePath, outputContents, 'utf-8');
logger.info(`Embedded environment variables written to ${outputFilePath}`);
