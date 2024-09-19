import 'reflect-metadata';
import { logger } from '@azure/identity';
import { App } from './App';
import { setup } from './common/AppStart';

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
