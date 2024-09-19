import 'reflect-metadata';
import { logger } from '@azure/identity';
import { setup } from './common/AppStart';
import { App } from './App';

const init = async () => {
    logger.verbose('Starting app...');
    await setup();
    const app = new App();
    app.listen();
};

init()
    .then(() => {
        console.log('App started');
    })
    .catch((error) => {
        console.error('Error starting app: ', error);
    });
