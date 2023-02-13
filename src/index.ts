import app from './app';
import logger from './core/utils/logger';
import config from './core/config/config';
import nodeErrorHandler from './core/middlewares/nodeErrorHandler';

const { port, host } = config;

process.on('unhandledRejection', async (err) => {
  logger.error('Unhandled rejection', err);
});

process.on('uncaughtException', async (err) => {
  logger.error('Uncaught exception', err);
});

app
  .listen(+port, host, () => {
    logger.log('info', `Server started at http://${host}:${port}`);
  })
  .on('error', nodeErrorHandler);
