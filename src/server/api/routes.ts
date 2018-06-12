import { wrap } from 'async-middleware';
import { NextFunction, Request, Response, Router } from 'express';

async function loadData(): Promise<any> {
    // here be dragons
}

export async function serveRawData(_req: Request, res: Response, _next: NextFunction) {
    // this form of data should be returned by server
    const data = await loadData();
    res.json(data);
}

export function register(app: Router): void {
    const router = Router();
    router.get('/', wrap(serveRawData));
    app.use('/graph', router);
}
