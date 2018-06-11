import * as express from 'express';
import { apiPrefix } from 'common/constants';
import * as webpack from 'webpack';
import * as webpackDevMiddleware from 'webpack-dev-middleware';
import * as webpackHotMiddleware from 'webpack-hot-middleware';
import * as path from 'path';
import config from 'webpack/config';

export function registerApi(app: express.Application, register: Function): void {
    const router = express.Router();
    register(router);
    app.use(apiPrefix, router);
}

export function registerApp(app: express.Application, register: Function): void {
    const appRouter = express.Router();
    register(appRouter);
    app.use('/', appRouter);
}

function registerWebpack(router: express.Application) {
    const compiler = webpack(config);
    const middleware = webpackDevMiddleware(compiler, {
        publicPath: config.output.publicPath,
        serverSideRender: true,
    });
    router.use(middleware);
    router.use(webpackHotMiddleware(compiler, {
        log: console.log, path: '/__webpack_hmr', heartbeat: 10 * 1000,
    }));

}

export function setupApp(): express.Application {
    const app = express();
    registerWebpack(app);
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.locals.req = req;
        next();
    });
    app.use('/static', express.static(path.join(__dirname, '../../static')));
    app.use('/dist', express.static(path.join(__dirname, '../../dist')));
    app.use('/tmp', express.static('tmp'));
    return app;
}
