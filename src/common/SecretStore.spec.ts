import * as fs from 'fs';
import { getCertificateFromPath } from './SecretStore';
import { Logger } from './Logger';

// Mock the logger to prevent actual logging during tests
jest.mock('./Logger', () => ({
    Logger: jest.fn().mockImplementation(() => ({
        error: jest.fn(),
    })),
}));

// Mock the entire 'fs' module
jest.mock('fs');

describe('getCertificateFromPath', () => {
    const mockCertificateContent = 'mock certificate content';

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should read the certificate file and return its contents as a string', () => {
        // Mock the fs.statSync and fs.readFileSync
        (fs.statSync as jest.Mock).mockReturnValueOnce({
            isDirectory: () => false,
        });
        (fs.readFileSync as jest.Mock).mockReturnValueOnce(
            mockCertificateContent
        );

        const result = getCertificateFromPath('mock/path/to/cert.pem');
        expect(result).toBe(mockCertificateContent);
    });

    it('should throw an error if the path is a directory', () => {
        (fs.statSync as jest.Mock).mockReturnValueOnce({
            isDirectory: () => true,
        });

        expect(() => getCertificateFromPath('mock/path/to/cert.pem')).toThrow(
            'Could not read certificate from the specified path.'
        );
    });

    it('should throw an error if reading the file fails', () => {
        (fs.statSync as jest.Mock).mockReturnValueOnce({
            isDirectory: () => false,
        });
        (fs.readFileSync as jest.Mock).mockImplementationOnce(() => {
            throw new Error('File read error');
        });

        expect(() => getCertificateFromPath('mock/path/to/cert.pem')).toThrow(
            'Could not read certificate from the specified path.'
        );
    });
});
