import { wrap } from 'async-middleware';
import { NextFunction, Request, Response, Router } from 'express';
// import { generate } from './generate-data';

export async function renderLayout(_req: Request, res: Response, _next: NextFunction) {
    const layout = await import('../components/layout');
    const html = layout.render();
    res.send(html);
}
/*
export async function genData(_req: Request, res: Response, _next: NextFunction) {
    await generate();
    res.json(true);
}
*/
export function register(app: Router): void {
    const router = Router();
    router.get('/', wrap(renderLayout));
    // router.get('/gen', wrap(genData));
    app.use('/', router);
}
