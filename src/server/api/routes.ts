import * as fs from 'fs-extra';
import { wrap } from 'async-middleware';
import { NextFunction, Request, Response, Router } from 'express';
import { baseDataDir } from 'common/constants';
import { GraphData, NodeItem, Transaction } from 'common/types';

const numNodes = 5000;
const maxTrans = 1000;

async function loadData(): Promise<GraphData> {
    const tFileName = `${baseDataDir}/data-transaction-${numNodes}-${maxTrans}.json`;
    const nFileName = `${baseDataDir}/data-nodes-${numNodes}-${maxTrans}.json`;
    const nodes: NodeItem[] = await fs.readJson(nFileName);
    const transactions: Transaction[] = await fs.readJson(tFileName);
    const graph: GraphData = {
        nodes: nodes,
        transactions: transactions,
    };
    return graph;
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
