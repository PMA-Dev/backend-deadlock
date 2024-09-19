import 'reflect-metadata';
import { Volume, createFsFromVolume } from 'memfs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { setup, rawSetup } from './AppStart';
import { FetchEnvFromAkv } from './FetchEnvFromAkv';
import { Logger } from './Logger';

// Mock FetchEnvFromAkv and Logger
jest.mock('./FetchEnvFromAkv');
jest.mock('./Logger');

describe('setup and rawSetup functions', () => {
    let vol: any;
    let memFs: any;
    let loggerMock: jest.Mocked<Logger>;

    beforeEach(() => {
        vol = new Volume();
        memFs = createFsFromVolume(vol);
        jest.resetModules();

        // Mock the fs module with memfs
        jest.doMock('fs', () => memFs);

        // Prepare a logger mock
        loggerMock = new Logger().setup(
            'app start spec'
        ) as jest.Mocked<Logger>;
        (Logger as any).mockImplementation(() => loggerMock);

        // Mock environment variable fetching
        (FetchEnvFromAkv as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should correctly load environment variables from local.env and .env', async () => {
        // Arrange: Write local.env and .env to the mock filesystem
        const localEnvPath = '/local.env';
        const dotenvPath = '/.env';
        vol.writeFileSync(
            localEnvPath,
            'LOCAL_VAR=local_value\nSECRET_FILE_VER=1'
        );
        vol.writeFileSync(dotenvPath, 'ENV_VAR=env_value\n');

        // Act: Run the setup function
        await setup();

        // Assert: Check if environment variables are set correctly
        expect(process.env.LOCAL_VAR).toBe('local_value');
        expect(process.env.ENV_VAR).toBe('env_value');
        expect(loggerMock.verbose).toHaveBeenCalledWith(
            expect.stringContaining('Loading environment variables from')
        );
    });

    it('should clear existing environment variables and handle errors', async () => {
        // Arrange: Set some initial environment variables
        process.env.SOME_VAR = 'some_value';
        process.env.OTHER_VAR = 'other_value';

        // Mock the FetchEnvFromAkv to throw an error
        const error = new Error('Failed to fetch env from AKV');
        (FetchEnvFromAkv as jest.Mock).mockRejectedValue(error);

        // Act & Assert: Run rawSetup and expect it to throw an error
        await expect(rawSetup()).rejects.toThrow(error);

        // Ensure environment variables were cleared
        expect(process.env.SOME_VAR).toBeUndefined();
        expect(process.env.OTHER_VAR).toBeUndefined();

        expect(loggerMock.verbose).toHaveBeenCalledWith(
            'Clearing existing environment variables...'
        );
        expect(loggerMock.error).toHaveBeenCalledWith(
            'Failed to fetch or load environment variables from AKV:',
            error
        );
    });
});
