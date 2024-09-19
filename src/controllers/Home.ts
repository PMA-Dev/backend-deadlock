import { NextFunction, Request, Response } from 'express';
import { Logger } from '../common/Logger';
import { injectable, inject } from 'tsyringe';
import { GetHomeResponse } from '@models/GetHomeResponse';

@injectable()
export class HomeController {
    constructor(@inject(Logger) private logger: Logger) {}

    public async homeGet(
        req: Request,
        res: Response<GetHomeResponse>,
        next: NextFunction
    ): Promise<void> {
        res.json({ ok: true });
    }
}
