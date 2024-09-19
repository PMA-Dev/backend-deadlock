import { ClientCertificateCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { getCertificateFromPath } from './SecretStore';
import { CommonConfig, CommonConfigKeys } from './CommonConfig';
import { Logger } from './Logger';

const logger = new Logger().setup(__filename, true);

export const getCredential = (): ClientCertificateCredential => {
    const config = new CommonConfig();
    const tenantId = config.getByKey(CommonConfigKeys.AKV_TENANT_ID);
    const clientId = config.getByKey(CommonConfigKeys.AKV_CLIENT_ID);
    const certificatePath = path.join(
        __dirname,
        config.getByKey(CommonConfigKeys.AKV_LOCAL_CERT_PATH)
    );

    logger.verbose('Fetching secret from Azure Key Vault with args', {
        tenantId,
        clientId,
        certificatePath,
    });

    const certificate = getCertificateFromPath(certificatePath);

    return new ClientCertificateCredential(tenantId, clientId, {
        certificate,
    });
};

export const fetchSecretFromAkv = async (
    credential: ClientCertificateCredential
) => {
    const config = new CommonConfig();
    const keyVaultName = config.getByKey(CommonConfigKeys.AKV_NAME);
    const url = `https://${keyVaultName}.vault.azure.net`;
    const client = new SecretClient(url, credential);
    const secretName = config.getByKey(CommonConfigKeys.AKV_SECRET_NAME);
    const secretVersion = config.getByKey(CommonConfigKeys.SECRET_FILE_VER);

    try {
        logger.verbose(
            'Fetching secret from Azure Key Vault with ver: ',
            secretVersion
        );
        const secret = await client.getSecret(secretName, {
            version: secretVersion,
        });
        return secret.value?.replace(/\\n/g, '\n') || '';
    } catch (error) {
        logger.error('Failed to fetch secret from Azure Key Vault:', { error });
        throw error;
    }
};

export const loadExistingEnv = (
    envFilePath: string
): { [key: string]: string } => {
    if (fs.existsSync(envFilePath)) {
        return dotenv.parse(fs.readFileSync(envFilePath, 'utf8'));
    }
    return {};
};

export const logEnvChanges = (
    existingEnv: { [key: string]: string },
    newEnv: { [key: string]: string }
) => {
    const addedKeys: string[] = [];
    const modifiedKeys: string[] = [];

    Object.entries(newEnv).forEach(([key, value]) => {
        if (!existingEnv.hasOwnProperty(key)) {
            addedKeys.push(key);
        } else if (existingEnv[key] !== value) {
            modifiedKeys.push(key);
        }
    });

    if (addedKeys.length > 0) {
        logger.verbose(
            'Added environment variables:',
            addedKeys.map((key) => `+ ${key}`).join('\n')
        );
    }

    if (modifiedKeys.length > 0) {
        logger.verbose(
            'Modified environment variables:',
            modifiedKeys.map((key) => `~ ${key}`).join('\n')
        );
    }

    if (addedKeys.length > 0 || modifiedKeys.length > 0) {
        logger.verbose(
            'Final environment variables:',
            Object.entries(newEnv)
                .map(([key, value]) => `${key}`)
                .join('\n')
        );
    }
};

export const mergeAndSaveEnv = (
    existingEnv: { [key: string]: string },
    newEnv: { [key: string]: string },
    envFilePath: string
) => {
    logEnvChanges(existingEnv, newEnv);

    let shouldUseFile;
    const mergedEnv = { ...existingEnv, ...newEnv };
    const mergedEnvString = Object.entries(mergedEnv)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    try {
        // Attempt to write to the file system
        fs.writeFileSync(envFilePath, mergedEnvString, { encoding: 'utf8' });
        logger.verbose(
            'Environment variables successfully written to .env file.'
        );
        shouldUseFile = true;
    } catch (error) {
        // If writing to the file system fails, log the error and fall back to setting process.env
        logger.error(
            `Failed to write environment variables to ${envFilePath}: ${error}`
        );
        logger.verbose(
            'Falling back to setting environment variables in memory...'
        );

        // Set each environment variable in process.env
        Object.entries(mergedEnv).forEach(([key, value]) => {
            process.env[key] = value;
        });

        logger.verbose('Environment variables successfully set in memory.');
        shouldUseFile = false;
    }

    // Return the merged environment variables for testing or further processing
    return shouldUseFile;
};

export const FetchEnvFromAkv = async () => {
    const credential = getCredential();
    const secretValue = await fetchSecretFromAkv(credential);

    const config = new CommonConfig();
    const envFilePath = path.join(
        __dirname,
        config.getByKey(CommonConfigKeys.LOADED_DOTENV_PATH)
    );

    const existingEnv = loadExistingEnv(envFilePath);
    const newEnv = dotenv.parse(secretValue);

    return mergeAndSaveEnv(existingEnv, newEnv, envFilePath);
};
