import * as React from 'react';
import * as d3 from 'd3';
import DeckGL, {
    COORDINATE_SYSTEM,
    ScatterplotLayer,
    IconLayer,
    OrthographicView,
} from 'deck.gl';
import { BezierCurveLayer } from '@deck.gl/experimental-layers';
import {
    computeAngle,
    interpolateQuadraticBezier,
    interpolateQuadraticBezierAngle,
} from 'common/utils';
import { nodes, edges } from 'data/data';

const layerBaseConfig = {
    coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
    opacity: 1,
};
const nodeSize = 10;

const iconAtlas = {
    'marker': {
        'x': 0,
        'y': 64,
        'width': 64,
        'height': 64,
        'mask': true,
    },
};

export interface Props {
    container: HTMLElement; // preparation nfor window resize events
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
    pos: any;
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
            zoom: 1,
            pos: {},
        };
    }

    public componentDidMount() {
        this.makeTree();
    }

    public render() {
        const {offset: {x, y}, size: {width, height}, zoom, initialised} = this.state;
        if (initialised === true) {
            const layers = [this.createEdgesLayer(), this.createNodesLayer(), this.createArrowLayer()];
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
            const viewState = {
                eye: [0, 0, 1],
                lookAt: [0, 0, 0],
            };
            const view = new OrthographicView(vOpt);
            console.info(x, y, zoom, view.makeViewport({width, height, viewState}), vOpt);
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
                        viewState={viewState}
                    />
                </div>
            );
        }
        else {
            return null;
        }
    }

    private createEdgesLayer(): BezierCurveLayer {
        const sourcePositions = edges.map(edge => {
            return this.getEdgeStart(edge);
        });
        const targetPositions = edges.map(edge => {
            return this.getEdgeEnd(edge);
        });
        const midPositions = edges.map(edge => {
            return this.getEdgeMid(edge);
        });
        const layer = new BezierCurveLayer({
            ...layerBaseConfig,
            id: 'curve-layer',
            data: edges,
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

    private createNodesLayer(): ScatterplotLayer {
        const {pos} = this.state;

        const positions = nodes.map(node => {
            return pos[node.id];
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

    private createArrowLayer(): IconLayer {
        const positions = edges.map(edge => {
            return this.getArrowPos(edge);
        });
        const angles = edges.map(edge => {
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
            id: `arrow-layer`,
            data: edges,
            getPosition: (d) => this.getArrowPos(d),
            getAngle: (d) => this.geArrowAngle(d),
            updateTriggers: {
                getPosition: positions,
                getAngle: angles,
            },
            getSize: 20,
            getColor: [255, 0, 0],
        });
        return layer;
    }

    private geArrowAngle(edge) {
        const start = this.getEdgeStart(edge);
        const control = this.getEdgeMid(edge);
        const end = this.getEdgeEnd(edge);
        const interploator = interpolateQuadraticBezierAngle(start, control, end);
        const ang = interploator(0.5);
        return -ang;
    }

    private getArrowPos(edge) {
        const start = this.getEdgeStart(edge);
        const control = this.getEdgeMid(edge);
        const end = this.getEdgeEnd(edge);
        const interploator = interpolateQuadraticBezier(start, control, end);
        const pos = interploator(0.5);
        return [...pos, 0];
    }

    private getEdgeStart(edge) {
        const {pos} = this.state;
        return pos[edge.from];
    }

    private getEdgeMid(edge) {
        const {pos} = this.state;
        const source = pos[edge.from];
        const target = edge.from === edge.to ? [pos[edge.to][0] + 100, pos[edge.to][1] - 100] : pos[edge.to];
        const direction = source[0] > target[0] ? 1 : -1;
        const ang = (computeAngle(source, target) - 90) / (180 * Math.PI);
        const offset = ang * 50;
        const midPoint = [(source[0] + target[0]) / 2, (source[1] + target[1]) / 2];
        const dx = target[0] - source[0];
        const dy = target[1] - source[1];
        const normal = [dy, -dx];
        const length = Math.sqrt(Math.pow(normal[0], 2.0) + Math.pow(normal[1], 2.0));
        const normalized = [normal[0] / length, normal[1] / length];
        const ret = [
            midPoint[0] + normalized[0] * offset * direction || 0,
            midPoint[1] + normalized[1] * offset * direction || 0,
            0,
        ];
        return ret;
    }

    private getEdgeEnd(edge) {
        const {pos} = this.state;
        return pos[edge.to];
    }

    private getNodePosition(d) {
        const {pos} = this.state;
        return pos[d['id']];
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
        /**
         * TODO
         *
         * fix ratios when moving
         */
        const {dragging, currentNode} = this.state;
        if (dragging) {
            e.preventDefault();
            const {tmpMouse: {x, y}, offset, pos} = this.state;
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
                const nodePos = pos[currentNode.id];
                const newPos = [(nodePos[0] - dx), (nodePos[1] - dy), 0];
                pos[currentNode.id] = newPos;
                this.setState({
                    ...this.state,
                    pos: {...pos},
                    tmpMouse: {
                        x: e.screenX,
                        y: e.screenY,
                    },
                });
            }
        }
    }

    private makeTree() {
        const {pos} = this.state;
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
            pos[n.data.id] = [n['x'], n['y'], 0];
        }));
        this.setState({
            ...this.state,
            initialised: true,
            pos: pos,
        });
    }
}
