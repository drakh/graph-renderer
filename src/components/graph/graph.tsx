import * as React from 'react';
import * as d3 from 'd3';
import DeckGL, { COORDINATE_SYSTEM, ScatterplotLayer, IconLayer, OrthographicView } from 'deck.gl';
import { BezierCurveLayer } from '@deck.gl/experimental-layers';
import { NodeItem, NodeLink } from 'common/types';
import { interpolateQuadraticBezier, interpolateQuadraticBezierAngle } from 'common/utils';

const layerBaseConfig = {
    coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
    opacity: 1,
};
const nodeSize = 10;
const loopSize = 20;
const iconAtlas = {
    'marker': {
        'x': 0,
        'y': 64,
        'width': 64,
        'height': 64,
        'mask': true,
    },
};

interface Line {
    from: number[];
    to: number[];
}

type PosMap = Map<string, number[]>;

export interface Props {
    container: HTMLElement; // preparation nfor window resize events
    nodes: NodeItem[];
    edges: NodeLink[];
}

export interface State {
    initialised: boolean;
    size: {
        width: number;
        height: number;
    };
    offset: {
        x: number;
        y: number;
    };
    currentNode: any;
    zoom: number;
    dragging: boolean;
    tmpMouse?: {
        x: number,
        y: number,
    };
    pos: PosMap;
    graphEdges: NodeLink[];
    graphLoops: NodeLink[];
    loops: Line[];
    lines: Line[];
}

export class Graph extends React.Component<Props, State> {
    public constructor(props) {
        super(props);
        const {container} = this.props;
        const height = container.offsetHeight;
        const width = container.offsetWidth;

        this.state = {
            currentNode: null,
            dragging: false,
            offset: {
                x: 0,
                y: 0,
            },
            size: {
                width: width,
                height: height,
            },
            initialised: false,
            zoom: 3,
            pos: new Map<string, number[]>(),
            graphEdges: [],
            graphLoops: [],
            loops: [],
            lines: [],
        };
    }

    public componentDidMount() {
        this.makeTree(this.props.nodes, this.props.edges);
    }

    public render() {
        const {lines, loops, pos, offset: {x, y}, size: {width, height}, zoom, initialised} = this.state;
        console.info(pos.get('a'));
        const {nodes} = this.props;
        if (initialised === true) {
            const layers = [
                this.createEdgesLayer(lines),
                this.createEdgesLayer(loops, 'loops'),
                this.createArrowLayer(lines),
                this.createArrowLayer(loops, 'loops'),
                this.createNodesLayer(nodes, pos),
            ];
            const left = ((-width / 2) + x);
            const top = ((-height / 2) + y);
            const vOpt = {
                left: left / zoom,
                top: top / zoom,
                right: (left + width) / zoom,
                bottom: (top + height) / zoom,
                width: width,
                height: height,
                near: 0,
                far: 1000,
            };
            const view = new OrthographicView(vOpt);
            return (
                <div
                    onWheel={(e) => this.onWheel(e)}
                    onMouseDown={(e) => this.startDrag(e)}
                    onMouseUp={(e) => this.endDrag(e)}
                    onMouseMove={(e) => this.drag(e)}
                >
                    <DeckGL
                        debug={true}
                        width={width}
                        height={height}
                        views={view}
                        layers={layers}
                    />
                </div>
            );
        }
        else {
            return null;
        }
    }

    private createEdgesLayer(lines: Line[], id = 'base'): BezierCurveLayer {
        const sourcePositions = lines.map(edge => {
            return this.getEdgeStart(edge);
        });
        const targetPositions = lines.map(edge => {
            return this.getEdgeEnd(edge);
        });
        const midPositions = lines.map(edge => {
            return this.getEdgeMid(edge);
        });
        const layer = new BezierCurveLayer({
            ...layerBaseConfig,
            id: `curve-layer-${id}`,
            data: lines,
            getSourcePosition: d => this.getEdgeStart(d),
            getTargetPosition: d => this.getEdgeEnd(d),
            getControlPoint: d => this.getEdgeMid(d),
            getColor: (_e) => {
                return [150, 150, 150, 255];
            },
            updateTriggers: {
                getSourcePosition: sourcePositions,
                getTargetPosition: targetPositions,
                getControlPoint: midPositions,
            },
            strokeWidth: 10,
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 0, 0, 255],
        });
        return layer;
    }

    private createNodesLayer(nodes: NodeItem[], pos: PosMap): ScatterplotLayer {
        const positions = nodes.map(node => {
            return pos.get(node.id);
        });
        const layer = new ScatterplotLayer({
            ...layerBaseConfig,
            autoHighlight: true,
            id: `nodes-layer-`,
            data: nodes,
            pickable: true,
            radiusScale: 1,
            radiusMinPixels: 10,
            radiusMaxPixels: 10,
            getRadius: 10,
            updateTriggers: {
                getPosition: positions,
            },
            highlightColor: [255, 0, 0, 255],
            getPosition: (d) => this.getNodePosition(d),
            onHover: (e) => this.onNodeOver(e),
            getColor: [255, 255, 0],
        });
        return layer;
    }

    private onNodeOver(e) {
        if (e.picked) {
            const {nodes} = this.props;
            this.setState({
                ...this.state,
                currentNode: nodes[e.index],
            });
        }
        else {
            this.setState({
                ...this.state,
                currentNode: null,
            });
        }
    }

    private createArrowLayer(lines: Line[], id = 'base'): IconLayer {
        const positions = lines.map(edge => {
            return this.getArrowPos(edge);
        });
        const angles = lines.map(edge => {
            return this.geArrowAngle(edge);
        });
        const layer = new IconLayer({
            ...layerBaseConfig,
            iconAtlas: '/static/images/icon-atlas.png',
            iconMapping: iconAtlas,
            sizeScale: 4,
            getIcon: () => {
                return 'marker';
            },
            autoHighlight: true,
            pickable: true,
            id: `arrow-layer-${id}`,
            data: lines,
            getPosition: (d) => this.getArrowPos(d),
            getAngle: (d) => this.geArrowAngle(d),
            updateTriggers: {
                getPosition: positions,
                getAngle: angles,
            },
            getSize: 10,
            getColor: [255, 0, 0],
        });
        return layer;
    }

    private geArrowAngle(edge: Line) {
        const start = this.getEdgeStart(edge);
        const control = this.getEdgeMid(edge);
        const end = this.getEdgeEnd(edge);
        const interploator = interpolateQuadraticBezierAngle(start, control, end);
        const ang = interploator(0.5);
        return -ang;
    }

    private getArrowPos(edge: Line) {
        const start = this.getEdgeStart(edge);
        const control = this.getEdgeMid(edge);
        const end = this.getEdgeEnd(edge);
        const interploator = interpolateQuadraticBezier(start, control, end);
        const pos = interploator(0.5);
        return [...pos, 0];
    }

    private getEdgeStart(edge: Line) {
        return edge.from;
    }

    private getEdgeMid(edge: Line) {
        const source = edge.from;
        const target = edge.to;
        const dx = (target[0] - source[0]);
        const dy = (target[1] - source[1]);
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);
        const ax = (adx / 5) * (dx / adx) || 0;
        const ay = (ady / 5) * (dy / ady) || 0;
        const ret = [(adx > ady ? target[0] - ax : source[0] + ax), (adx > ady ? source[1] + ay : target[1] - ay), 0];
        return ret;
    }

    private getEdgeEnd(edge: Line) {
        return edge.to;
    }

    private getNodePosition(d: NodeItem): number[] {
        const {pos} = this.state;
        const ret = pos.get(d.id);
        if (d.id === 'a') {
            console.info('getNodePosition', ret);
        }
        return ret;
    }

    private onWheel(e: React.MouseEvent<HTMLElement>) {
        e.preventDefault();
        const {zoom} = this.state;
        const dz = e.nativeEvent['deltaY'] > 0 ? -1 : 1;
        const z = zoom + (dz * 0.2);
        this.setState({
            ...this.state,
            zoom: z >= 0.1 ? z : 0.1,
        });
    }

    private startDrag(e: React.MouseEvent<HTMLElement>) {
        e.preventDefault();
        this.setState({
            ...this.state,
            dragging: true,
            tmpMouse: {
                x: e.screenX,
                y: e.screenY,
            },
        });
    }

    private endDrag(e: React.MouseEvent<HTMLElement>) {
        e.preventDefault();
        this.setState({
            ...this.state,
            dragging: false,
        });
    }

    private drag(e: React.MouseEvent<HTMLElement>) {
        const {dragging, currentNode, zoom} = this.state;
        if (dragging) {
            e.preventDefault();
            const {tmpMouse: {x, y}, offset} = this.state;
            const dx = (x - e.screenX);
            const dy = (y - e.screenY);
            if (!currentNode) {
                this.setState({
                    ...this.state,
                    offset: {
                        x: offset.x + dx,
                        y: offset.y + dy,
                    },
                    tmpMouse: {
                        x: e.screenX,
                        y: e.screenY,
                    },
                });
            }
            else {
                const {graphEdges, graphLoops, pos} = this.state;
                const nodePos = pos.get(currentNode.id);
                const newPos = [(nodePos[0] - dx / zoom), (nodePos[1] - dy / zoom), 0];
                pos.set(currentNode.id, newPos);
                this.setState({
                    ...this.state,
                    pos: pos,
                    tmpMouse: {
                        x: e.screenX,
                        y: e.screenY,
                    },
                    lines: this.getEdgeLines(graphEdges, pos),
                    loops: this.getLoopLines(graphLoops, pos),
                });
            }
        }
    }

    private makeTree(nodes: NodeItem[], edges: NodeLink[]) {
        const {pos} = this.state;
        const loops = edges.filter(edge => {
            return edge.to === edge.from;
        });
        const lines = edges.filter(edge => {
            return edge.to !== edge.from;
        });
        const map = nodes.map(node => {
            const parent = edges.filter(edge => {
                return edge.to === node.id;
            });
            return {
                id: node.id,
                parentId: parent.length > 0 ? (parent[0].from !== parent[0].to ? parent[0].from : null) : null,
            };
        });
        const treeData = d3.stratify().id((d) => {
            return d['id'];
        }).parentId((d) => {
            return d['parentId'];
        })(map);
        const root = d3.hierarchy(treeData);
        const layout = d3.tree();
        layout.nodeSize([nodeSize * 5, nodeSize * 5]);
        layout(root);
        const p = root.descendants();
        p.forEach((n => {
            pos.set(n.data.id, [n['x'], n['y'], 0]);
        }));

        this.setState({
            ...this.state,
            initialised: true,
            pos: pos,
            graphEdges: lines,
            graphLoops: loops,
            lines: this.getEdgeLines(lines, pos),
            loops: this.getLoopLines(loops, pos),
        });
    }

    private getLoopLines(loops: NodeLink[], pos: PosMap): Line[] {
        const sLoops: Line[] = [];
        loops.forEach(loop => {
            const lPos = pos.get(loop.from);
            sLoops.push({
                from: lPos,
                to: [lPos[0] + loopSize, lPos[1] - loopSize, 0],
            });
            sLoops.push({
                to: lPos,
                from: [lPos[0] + loopSize, lPos[1] - loopSize, 0],
            });
        });
        return sLoops;
    }

    private getEdgeLines(lines: NodeLink[], pos: PosMap): Line[] {
        return lines.map(line => {
            return {
                from: pos.get(line.from),
                to: pos.get(line.to),
            };
        });
    }
}
