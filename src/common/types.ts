export type wallet = string;
export type nodeId = string;

export interface NodeData {
    wallets: wallet[];
    label: string;
}

export interface NodeItem {
    id: nodeId;
    data?: NodeData;
}

export interface NodeLink {
    from: nodeId;
    to: nodeId;
}
