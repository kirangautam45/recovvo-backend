import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import express from 'express';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';

import routes from './routes';
import swaggerDocs from './swagger';
import config from './core/config/config';
import notFoundHandler from './core/middlewares/notFoundHandler';
import genericErrorHandler from './core/middlewares/genericErrorHandler';

const { name, version } = config;

const app: express.Application = express();
app.locals.name = name;
app.locals.version = version;

app.use(cors());
app.use(helmet());

if (app.get('env') === 'development') {
  app.use(morgan('dev'));
  app.use(cors());
}

if (app.get('env') === 'production') {
  app.use(morgan('combined'));
  app.use(
    cors({
      origin: process.env.APP_HOST
    })
  );
}

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(genericErrorHandler);
app.use(notFoundHandler);

export default app;
