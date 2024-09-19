import { SmsClient } from '@azure/communication-sms';
import { CommonConfig, CommonConfigKeys } from '../common/CommonConfig';
import { inject, injectable } from 'tsyringe';
import { Logger } from '../common/Logger';

@injectable()
export class SendSms {
    private smsClient: SmsClient;
    private sourcePhoneNumber: string;

    constructor(
        @inject(CommonConfig) private commonConfig: CommonConfig,
        @inject(Logger) private logger: Logger
    ) {
        const connectionString = this.commonConfig.getByKey(
            CommonConfigKeys.SMS_CONNECTION_STRING
        );
        this.sourcePhoneNumber = this.commonConfig.getByKey(
            CommonConfigKeys.SMS_SOURCE_PHONE_NUMBER
        );
        this.smsClient = new SmsClient(connectionString);
    }
    public async sendSms(
        toNumber: string,
        text: string
    ): Promise<SendSmsResult> {
        try {
            this.logger.verbose(
                'Sending SMS to: ',
                toNumber,
                ' with text: ',
                text
            );
            await this.smsClient.send({
                from: this.sourcePhoneNumber,
                to: [toNumber],
                message: text,
            });
            return { success: true };
        } catch (error) {
            this.logger.error('Error sending SMS: ', error);
            throw error;
        }
    }
}

export interface SendSmsResult {
    success: boolean;
    message?: any;
}
