import 'reflect-metadata';
import { Logger } from '@/common/Logger';
import { Db, Document, Filter, MongoClient } from 'mongodb';
import { inject, injectable } from 'tsyringe';
import { CommonConfig, CommonConfigKeys } from '@/common/CommonConfig';

// Replace the following with your Atlas connection string

@injectable()
export class DbClient {
    private client?: MongoClient;
    private dbHandle?: Db;
    constructor(
        @inject(Logger) private logger: Logger,
        @inject(CommonConfig) private config: CommonConfig
    ) {}

    public setup = async (): Promise<void> => {
        if (this.client !== undefined) {
            return;
        }

        const uri = this.config.getByKey(
            CommonConfigKeys.MONGODB_CONNECTION_STRING
        );
        const dbName = this.config.getByKey(CommonConfigKeys.MONGO_DB_NAME);

        this.client = new MongoClient(uri);
        await this.client.connect();

        this.dbHandle = this.client.db();
    };

    public queryWithFilter = async (
        filter: Filter<Document>,
        tableName: string = this.config.getByKey(
            CommonConfigKeys.MONGO_TABLE_NAME
        )
    ): Promise<Document | null> => {
        try {
            await this.setup();
            const col = this.dbHandle!.collection(tableName);
            const document = await col.findOne(filter);

            if (document === null) {
                this.logger.error('No document found with query:', filter);
                throw new Error('No document found');
            }

            return document;
        } catch (e) {
            this.logger.error(e);
            return null;
        }
    };
}
