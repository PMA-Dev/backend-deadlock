import { CommonConfig, CommonConfigKeys } from '../common/CommonConfig';
import { QueueClient } from '@azure/storage-queue';
import { QueueData, QueueEventData } from '../models/QueueData';
import { injectable, inject } from 'tsyringe';
import { Logger } from '../common/Logger';

@injectable()
export class ConsumeSms {
    private queueClient: QueueClient;
    constructor(
        @inject(CommonConfig) private commonConfig: CommonConfig,
        @inject(Logger) private logger: Logger
    ) {
        this.commonConfig = new CommonConfig();
        const connString = this.commonConfig.getByKey(
            CommonConfigKeys.STORAGE_CONNECTION_STRING
        );
        const queueName = this.commonConfig.getByKey(
            CommonConfigKeys.STORAGE_QUEUE_NAME
        );

        this.logger.verbose('attempting connection to queue client...');
        this.queueClient = new QueueClient(connString, queueName);
        this.logger.verbose('connection to queue client successful');
    }

    public async peekAtMessages(
        numberOfMessages?: number,
        filter?: (input: QueueEventData) => boolean
    ): Promise<QueueEventData[]> {
        const peekedMessages = await this.queueClient.peekMessages({
            numberOfMessages: numberOfMessages ?? 5,
        });

        return peekedMessages.peekedMessageItems
            .map((item) => decodeMessageText(item.messageText))
            .map((queueItem) => queueItem.data)
            .filter((item) => {
                return !!filter ? filter(item) : true;
            });
    }
}

const decodeMessageText = (encodedMessage: string): QueueData => {
    const decodedMessage = Buffer.from(encodedMessage, 'base64').toString(
        'utf-8'
    );
    return JSON.parse(decodedMessage);
};
