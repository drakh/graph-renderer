export type wallet = string;
export type nodeId = string;
export type transactionId = string;
export type coordinate = number;
export type nodeMap = Map<nodeId, NodeItem>;
export type transactionMap = Map<transactionId, Transaction>;
export type coordinatesMap = Map<nodeId, Coordinates>;
export type transactionNodeMap = Map<transactionId, nodeId>;
export type nodeTransactionMap = Map<nodeId, transactionId[]>;

export interface NodeData {
    wallets: wallet[];
    label: string;
}

export interface Coordinates {
    x: coordinate;
    y: coordinate;
}

export interface NodeItem {
    id: nodeId;
    data: NodeData;
}

export interface Transaction {
    id: transactionId;
    source: nodeId;
    target: nodeId;
    weight: number;
    label: string;
}

export interface GraphData {
    nodes: NodeItem[];
    transactions: Transaction[];
}

export interface Bounds {
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
}

export interface NodeLink {
    source: nodeId;
    target: nodeId;
}

export interface GraphInfo {
    bounds: Bounds;
    coordinates: coordinatesMap;
}
