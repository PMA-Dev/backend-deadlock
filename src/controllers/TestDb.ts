import 'reflect-metadata';
import { NextFunction, Request, Response } from 'express';
import { Logger } from '../common/Logger';
import { injectable, inject } from 'tsyringe';
import { DbClient } from '../services/DbClient';
import { QueryWithFilterResponse } from '../models/QueryWithFilterResponse';
import {
    QueryWithFilterRequest,
    queryWithFilterRequestSchema,
} from '../models/QueryWithFilterRequest';
import { validateAndSendIfFail } from '../common/utils';

@injectable()
export class TestDbController {
    constructor(
        @inject(Logger) private logger: Logger,
        @inject(DbClient) private DbClient: DbClient
    ) {}

    public async queryWithFilter(
        req: Request<{}, {}, QueryWithFilterRequest>,
        res: Response<QueryWithFilterResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            validateAndSendIfFail(req, res, queryWithFilterRequestSchema);
            const filter = req.body.filter;
            const data = await this.DbClient.queryWithFilter(filter);
            this.logger.info('Data:', data);
            this.logger.info('filter:', filter);
            if (!data) {
                this.logger.error('No document found sending 404');
                res.status(404).json({
                    error: `No document found with filter ${JSON.stringify(filter)}`,
                });
                return;
            }
            res.json({ data });
        } catch (e) {
            this.logger.error('caught error at testdbquery', e);
            next(e);
        }
    }
}
