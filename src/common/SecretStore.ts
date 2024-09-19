import * as fs from 'fs';
import { Logger } from './Logger';

const logger = new Logger().setup(__filename, true);

export const getCertificateFromPath = (certificatePath: string): string => {
    try {
        // Check if the path is a directory
        if (fs.statSync(certificatePath).isDirectory()) {
            logger.error(
                'The provided certificate path is a directory, not a file:',
                certificatePath
            );
            throw new Error(
                'The provided certificate path is a directory, not a file.'
            );
        }

        // Read the certificate file as a string
        const certificate = fs.readFileSync(certificatePath, 'utf8');
        return certificate;
    } catch (error) {
        logger.error('Failed to read certificate from path:', { error });
        throw new Error('Could not read certificate from the specified path.');
    }
};
