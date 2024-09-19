import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { CommonConfig, CommonConfigKeys } from './common/CommonConfig';
import { HomeController } from './controllers/Home';

export class App {
    public app: Application;
    private homeController: HomeController;

    constructor() {
        this.app = express();
        this.homeController = container.resolve(HomeController);
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
        this.app.get(
            '/home',
            this.homeController.homeGet.bind(this.homeController)
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
