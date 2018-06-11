import * as _ from 'lodash';
import * as uuid from 'uuid';
import * as fs from 'fs-extra';
import * as types from 'common/types';
import { baseDataDir } from 'common/constants';

const numNodes = 20000;
const maxTrans = 20000;

export async function generate() {
    const transactionIds: types.transactionId[] = [];
    const nodeIds: types.nodeId[] = [];
    for (let i = 0; i < numNodes; i++) {
        const id = uuid.v4();
        nodeIds.push(id);
    }
    const transactionSourceMap = new Map<types.transactionId, types.nodeId>();
    const nodes: types.NodeItem[] = nodeIds.map((nodeId) => {
        const wallets: types.wallet[] = [];
        const sw = _.random(1, 100, false);
        let min = 1;
        let max = 5;
        if (sw < 70) {
            min = 1;
            max = 5;
        }
        else if (sw < 80) {
            min = 5;
            max = 8;
        }
        else if (sw < 100) {
            min = 8;
            max = 10;
        }
        else {
            min = 10;
            max = maxTrans;
        }
        const numT = _.random(min, max, false);
        for (let i = 0; i < numT; i++) {
            const transactionId = uuid.v4();
            transactionSourceMap.set(transactionId, nodeId);
            transactionIds.push(transactionId);
        }
        const numW = _.random(5, 100, false);
        for (let i = 0; i < numW; i++) {
            wallets.push(uuid.v4());
        }
        const data: types.NodeItem = {
            id: nodeId,
            data: {
                wallets: wallets,
                label: `Transactions ${numT}`,
            },
        };
        return data;
    });
    await fs.writeJSON(`${baseDataDir}/data-nodes-${numNodes}-${maxTrans}.json`, nodes);

    const transactions: types.Transaction[] = transactionIds.map(transactionId => {
        const sourceId = transactionSourceMap.get(transactionId);
        const targetId = _.sample(nodeIds);
        const data: types.Transaction = {
            id: transactionId,
            source: sourceId,
            target: targetId,
            label: transactionId,
            weight: _.random(5, 1000, false),
        };
        return data;
    });
    await fs.writeJSON(`${baseDataDir}/data-transaction-${numNodes}-${maxTrans}.json`, transactions);
}
