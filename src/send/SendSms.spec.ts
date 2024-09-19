import 'reflect-metadata';
import { SendSms } from './SendSms';
import { CommonConfig, CommonConfigKeys } from '../common/CommonConfig';
import { Logger } from '../common/Logger';
import { SmsClient, SmsSendResult } from '@azure/communication-sms';

jest.mock('../common/CommonConfig');
jest.mock('../common/Logger');
jest.mock('@azure/communication-sms');

describe('SendSms', () => {
    let commonConfigMock: jest.Mocked<CommonConfig>;
    let loggerMock: jest.Mocked<Logger>;
    let smsClientMock: jest.Mocked<SmsClient>;
    let sendSms: SendSms;

    beforeEach(() => {
        // Mock CommonConfig to return specific values
        commonConfigMock = new CommonConfig() as jest.Mocked<CommonConfig>;
        commonConfigMock.getByKey.mockImplementation((key) => {
            switch (key) {
                case CommonConfigKeys.SMS_CONNECTION_STRING:
                    return 'fake-connection-string';
                case CommonConfigKeys.SMS_SOURCE_PHONE_NUMBER:
                    return '+1234567890';
                default:
                    return '';
            }
        });

        // Mock Logger methods
        loggerMock = new Logger().setup('sendsms spec') as jest.Mocked<Logger>;

        // Mock SmsClient methods
        smsClientMock = new SmsClient(
            'fake-connection-string'
        ) as jest.Mocked<SmsClient>;
        smsClientMock.send.mockResolvedValue([
            {
                to: '+9876543210',
                messageId: 'fake-message-id',
                httpStatusCode: 200,
                successful: true,
            },
        ] as SmsSendResult[]);

        // Create an instance of SendSms with the mocked dependencies
        sendSms = new SendSms(commonConfigMock, loggerMock);

        // Replace the real SmsClient with our mocked instance
        (sendSms as any).smsClient = smsClientMock;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should send an SMS and return a success result', async () => {
        // Arrange
        const toNumber = '+9876543210';
        const text = 'Hello, world!';

        // Act
        const result = await sendSms.sendSms(toNumber, text);

        // Assert
        expect(result).toEqual({ success: true });
        expect(loggerMock.verbose).toHaveBeenCalledWith(
            'Sending SMS to: ',
            toNumber,
            ' with text: ',
            text
        );
        expect(smsClientMock.send).toHaveBeenCalledWith({
            from: '+1234567890',
            to: [toNumber],
            message: text,
        });
    });

    it('should log an error and throw if sending SMS fails', async () => {
        // Arrange
        const toNumber = '+9876543210';
        const text = 'Hello, world!';
        const error = new Error('Failed to send SMS');
        smsClientMock.send.mockRejectedValue(error);

        // Act & Assert
        await expect(sendSms.sendSms(toNumber, text)).rejects.toThrow(error);
        expect(loggerMock.error).toHaveBeenCalledWith(
            'Error sending SMS: ',
            error
        );
    });
});
