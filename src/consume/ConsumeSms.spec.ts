import 'reflect-metadata';
import { ConsumeSms } from './ConsumeSms';
import { CommonConfig, CommonConfigKeys } from '../common/CommonConfig';
import { Logger } from '../common/Logger';
import { QueueClient, QueuePeekMessagesResponse } from '@azure/storage-queue';
import { QueueData, QueueEventData } from '../models/QueueData';

jest.mock('../common/CommonConfig');
jest.mock('../common/Logger');
jest.mock('@azure/storage-queue');

describe('ConsumeSms', () => {
    let commonConfigMock: jest.Mocked<CommonConfig>;
    let loggerMock: jest.Mocked<Logger>;
    let queueClientMock: jest.Mocked<QueueClient>;
    let consumeSms: ConsumeSms;

    beforeEach(() => {
        // Mock CommonConfig to return specific values
        commonConfigMock = new CommonConfig() as jest.Mocked<CommonConfig>;
        commonConfigMock.getByKey.mockImplementation((key) => {
            switch (key) {
                case CommonConfigKeys.STORAGE_CONNECTION_STRING:
                    return 'fake-connection-string';
                case CommonConfigKeys.STORAGE_QUEUE_NAME:
                    return 'fake-queue-name';
                default:
                    return '';
            }
        });

        // Mock Logger methods
        loggerMock = new Logger().setup('spec') as jest.Mocked<Logger>;

        // Mock QueueClient methods
        queueClientMock = new QueueClient(
            'fake-connection-string',
            'fake-queue-name'
        ) as jest.Mocked<QueueClient>;

        // Create an instance of ConsumeSms with the mocked dependencies
        consumeSms = new ConsumeSms(commonConfigMock, loggerMock);

        // Replace the real QueueClient with our mocked instance
        (consumeSms as any).queueClient = queueClientMock;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should peek at messages and return the decoded data', async () => {
        // Arrange
        const mockMessages: QueuePeekMessagesResponse = {
            _response: {} as any,
            peekedMessageItems: [
                {
                    messageText: toB64({
                        id: '1',
                        topic: 'test/topic',
                        subject: 'test/subject',
                        data: {
                            messageId: '1',
                            from: '+123456789',
                            to: '+987654321',
                            message: 'Hello',
                            receivedTimestamp: new Date().toISOString(),
                        },
                        eventType: 'TestEvent',
                        dataVersion: '1.0',
                        metadataVersion: '1',
                        eventTime: new Date().toISOString(),
                    }),
                    messageId: '1',
                    insertedOn: new Date(),
                    expiresOn: new Date(new Date().getTime() + 1000),
                    dequeueCount: 0,
                },
                {
                    messageText: toB64({
                        id: '2',
                        topic: 'test/topic',
                        subject: 'test/subject',
                        data: {
                            messageId: '2',
                            from: '+123456789',
                            to: '+987654321',
                            message: 'World',
                            receivedTimestamp: new Date().toISOString(),
                        },
                        eventType: 'TestEvent',
                        dataVersion: '1.0',
                        metadataVersion: '1',
                        eventTime: new Date().toISOString(),
                    }),
                    messageId: '2',
                    insertedOn: new Date(),
                    expiresOn: new Date(new Date().getTime() + 1000),
                    dequeueCount: 0,
                },
            ],
        };
        queueClientMock.peekMessages.mockResolvedValue(mockMessages);

        // Act
        const result = await consumeSms.peekAtMessages();

        // Assert
        expect(result).toEqual([
            {
                messageId: '1',
                from: '+123456789',
                to: '+987654321',
                message: 'Hello',
                receivedTimestamp: expect.any(String),
            },
            {
                messageId: '2',
                from: '+123456789',
                to: '+987654321',
                message: 'World',
                receivedTimestamp: expect.any(String),
            },
        ]);
        expect(queueClientMock.peekMessages).toHaveBeenCalledTimes(1);
    });

    it('should apply the filter function to the peeked messages', async () => {
        // Arrange
        const mockMessages: QueuePeekMessagesResponse = {
            _response: {} as any,
            peekedMessageItems: [
                {
                    messageText: toB64({
                        id: '1',
                        topic: 'test/topic',
                        subject: 'test/subject',
                        data: {
                            messageId: '1',
                            from: '+123456789',
                            to: '+987654321',
                            message: 'Hello',
                            receivedTimestamp: new Date().toISOString(),
                        },
                        eventType: 'TestEvent',
                        dataVersion: '1.0',
                        metadataVersion: '1',
                        eventTime: new Date().toISOString(),
                    }),
                    messageId: '1',
                    insertedOn: new Date(),
                    expiresOn: new Date(new Date().getTime() + 1000),
                    dequeueCount: 0,
                },
                {
                    messageText: toB64({
                        id: '2',
                        topic: 'test/topic',
                        subject: 'test/subject',
                        data: {
                            messageId: '2',
                            from: '+123456789',
                            to: '+987654321',
                            message: 'World',
                            receivedTimestamp: new Date().toISOString(),
                        },
                        eventType: 'TestEvent',
                        dataVersion: '1.0',
                        metadataVersion: '1',
                        eventTime: new Date().toISOString(),
                    }),
                    messageId: '2',
                    insertedOn: new Date(),
                    expiresOn: new Date(new Date().getTime() + 1000),
                    dequeueCount: 0,
                },
            ],
        };
        queueClientMock.peekMessages.mockResolvedValue(mockMessages);

        // Act
        const result = await consumeSms.peekAtMessages(
            5,
            (item) => item.message === 'Hello'
        );

        // Assert
        expect(result).toEqual([
            {
                messageId: '1',
                from: '+123456789',
                to: '+987654321',
                message: 'Hello',
                receivedTimestamp: expect.any(String),
            },
        ]);
        expect(queueClientMock.peekMessages).toHaveBeenCalledTimes(1);
    });
});

const toB64 = (data: QueueData) =>
    Buffer.from(JSON.stringify(data)).toString('base64');
