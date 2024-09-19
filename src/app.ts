import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import { SmsController } from './controllers/SmsController';
import { container } from 'tsyringe';
import { CommonConfig, CommonConfigKeys } from './common/CommonConfig';

export class App {
    public app: Application;
    private smsController: SmsController;

    constructor() {
        this.app = express();
        this.smsController = container.resolve(SmsController);
        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private initializeMiddlewares() {
        this.app.use(express.json());
        this.app.use(
            (err: Error, req: Request, res: Response, next: NextFunction) => {
                console.error(err.message);
                res.status(500).json({ error: err.message });
            }
        );
    }

    private initializeRoutes() {
        this.app.get('/', (req: Request, res: Response) => {
            res.send({ ok: true });
        });
        this.app.post(
            '/sms/send',
            this.smsController.sendSms.bind(this.smsController)
        );
        this.app.get(
            '/sms/peek',
            this.smsController.peekSms.bind(this.smsController)
        );
    }

    public listen() {
        const config = new CommonConfig();
        const host =
            config.getByKey(CommonConfigKeys.HOST_TO_USE) || 'localhost';
        const port =
            Number.parseInt(config.getByKey(CommonConfigKeys.PORT_TO_USE)) ||
            5050;
        this.app.listen(port, host, () => {
            console.log(`Server running on port ${host}:${port}`);
        });
    }
}
