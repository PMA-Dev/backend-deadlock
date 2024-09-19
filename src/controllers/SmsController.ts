import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { SendSms, SendSmsResult } from '../send/SendSms';
import { Logger } from '../common/Logger';
import { CommonResponse } from '../common/CommonResponse';
import { validateAndSendIfFail } from '../common/utils';
import { QueueEventData } from '../models/QueueData';
import { injectable, inject } from 'tsyringe';
import { ConsumeSms } from '../consume/ConsumeSms';

const sendSmsSchema = Joi.object({
    text: Joi.string().min(1).required(),
    to: Joi.string().min(11).required(),
});

@injectable()
export class SmsController {
    constructor(
        @inject(SendSms) private sendSmsClient: SendSms,
        @inject(ConsumeSms) private consumeSmsClient: ConsumeSms,
        @inject(Logger) private logger: Logger
    ) {}

    public async sendSms(
        req: Request<{}, {}, SendSmsRequestBody>,
        res: Response<SendSmsRequestResponse>,
        next: NextFunction
    ): Promise<void> {
        validateAndSendIfFail(req, res, sendSmsSchema);

        try {
            const result = await this.sendSmsClient.sendSms(
                req.body.to,
                req.body.text
            );
            res.send({ result });
        } catch (error) {
            this.logger.error('Error sending SMS: ', error);
            next(error);
        }
    }

    public async peekSms(
        req: Request<PeekSmsRequestBody, {}, {}>,
        res: Response<PeekSmsRequestResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            const result = await this.consumeSmsClient.peekAtMessages(
                req.params.amount
            );
            this.logger.verbose(
                'Peeked SMS: ',
                result,
                'sending amount: ',
                req.params.amount
            );
            res.send({ messages: result });
        } catch (error) {
            this.logger.error('Error peeking SMS: ', error);
            next(error);
        }
    }
}

interface SendSmsRequestBody {
    text: string;
    to: string;
}

interface SendSmsRequestResponse extends CommonResponse {
    result?: SendSmsResult;
}

interface PeekSmsRequestBody {
    amount?: number;
}

interface PeekSmsRequestResponse extends CommonResponse {
    messages: QueueEventData[];
}
