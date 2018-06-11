import { appPort } from 'common/constants';
import { setupApp, registerApp, registerApi } from './utils';
import { register as registerRender } from './routes';
import { register as registerDataApi } from './api/routes';

const app = setupApp();

registerApp(app, registerRender);
registerApi(app, registerDataApi);

app.listen(appPort, function () {
    console.info(`Express server listening on port: ${appPort}`);
});
