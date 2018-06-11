import * as React from 'react';
import * as d3 from 'd3';
import DeckGL, {
    COORDINATE_SYSTEM,
    PerspectiveViewport,
    ScatterplotLayer,
    PathLayer,
    PolygonLayer,
} from 'deck.gl';

const layerBaseConfig = {
    projectionMode: COORDINATE_SYSTEM.IDENTITY,
    coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
    opacity: 1,
};
const cameraBaseProps = {
    focalDistance: 5,
    up: [0, 1, 0],
    fov: 75,
    near: 1,
};
const nodes = [
    {id: 'a'},
    {id: 'b'},
    {id: 'c'},
    {id: 'd'},
    {id: 'e'},
    {id: 'f'},
    {id: 'i'},
    {id: 'j'},
    {id: 'k'},
    {id: 'l'},
    {id: 'm'},
    {id: 'n'},
];
const edges = [
    {
        from: 'a',
        to: 'a',
    },
    {
        from: 'a',
        to: 'b',
    },
    {
        from: 'a',
        to: 'c',
    },
    {
        from: 'c',
        to: 'd',
    },
    {
        from: 'c',
        to: 'l',
    },
    {
        from: 'c',
        to: 'm',
    },
    {
        from: 'c',
        to: 'n',
    },
    {
        from: 'd',
        to: 'e',
    },
    {
        from: 'd',
        to: 'd',
    },
    {
        from: 'd',
        to: 'i',
    },
    {
        from: 'd',
        to: 'j',
    },
    {
        from: 'd',
        to: 'k',
    },
    {
        from: 'a',
        to: 'f',
    },
];
const pos = {};
const nodeSize = 10;
const loopRadius = nodeSize * 1.5;
const lineW = 2;

export interface Props {
    container: HTMLElement; // preparation nfor window resize events
}

export interface State {
    initialised: boolean;
    size: {
        w: number;
        h: number;
    };
    camera: {
        x: number,
        y: number,
        z: number,
    };
    dragging: boolean;
    tmpMouse?: {
        x: number,
        y: number,
    };
}

export class Graph extends React.Component<Props, State> {
    public constructor(props) {
        super(props);
        const {container} = this.props;
        const height = container.offsetHeight;
        const width = container.offsetWidth;
        this.state = {
            dragging: false,
            size: {
                w: width,
                h: height,
            },
            camera: {
                x: 0,
                y: 0,
                z: 250,
            },
            initialised: false,
        };
    }

    public componentDidMount() {
        this.makeTree();
    }

    public render() {
        const {camera, size, initialised} = this.state;
        if (initialised === true) {
            const layers = [this.createEdgesLayer(), this.createNodesLayer(), this.createPolygonLayer()];
            const view = new PerspectiveViewport({
                ...cameraBaseProps,
                far: (camera.z + 30),
                eye: [camera.x, camera.y, camera.z],
                lookAt: [camera.x, camera.y, 0],
                width: size.w,
                height: size.h,
            });
            return (
                <div
                    onWheel={(e) => this.onWheel(e)}
                    onMouseDown={(e) => this.startDrag(e)}
                    onMouseUp={(e) => this.endDrag(e)}
                    onMouseMove={(e) => this.drag(e)}
                >
                    <DeckGL
                        debug={true}
                        width={size.w}
                        height={size.h}
                        viewport={view}
                        layers={layers}
                    />
                </div>
            );
        }
        else {
            return null;
        }
    }

    private createPolygonLayer(): PolygonLayer {
        const layer = new PolygonLayer({
            ...layerBaseConfig,
            data: edges,
            autoHighlight: true,
            id: `polygon-layer-`,
            pickable: true,
            stroked: false,
            highlightColor: [255, 0, 0, 255],
            getPolygon: (d) => this.getPolygon(d),
        });
        return layer;
    }

    private getPolygon(edge) {
        if (edge.to !== edge.from) {
            const dx = (pos[edge.to][0] - pos[edge.from][0]) / 2;
            const dy = (pos[edge.to][1] - pos[edge.from][1]) / 2;
            return this.computeCircle(3, [dx, dy], nodeSize * 0.6, this.computeAngle(edge));
        }
        else {
            const dx = (pos[edge.from][0] - ((loopRadius * 2) - (lineW * 2)));
            const dy = (pos[edge.from][1] + (loopRadius - (lineW * 2)));
            return this.computeCircle(3, [dx, dy], nodeSize * 0.6, Math.PI / 2);
        }
    }

    private createNodesLayer(): ScatterplotLayer {
        const layer = new ScatterplotLayer({
            ...layerBaseConfig,
            autoHighlight: true,
            id: `nodes-layer-`,
            data: nodes,
            pickable: true,
            radiusMinPixels: nodeSize,
            radiusMaxPixels: nodeSize,
            getRadius: nodeSize,
            highlightColor: [255, 0, 0, 255],
            getPosition: (d) => this.getNodePosition(d),
            getColor: [255, 255, 0],
        });
        return layer;
    }

    private createEdgesLayer(): PathLayer {
        const layer = new PathLayer({
            ...layerBaseConfig,
            autoHighlight: true,
            id: `edges-layer-`,
            data: edges,
            pickable: true,
            getWidth: lineW,
            widthMinPixels: lineW,
            widthMaxPixels: lineW,
            highlightColor: [255, 0, 0, 255],
            getPath: (d) => this.getPath(d),
        });
        return layer;
    }

    private getPath(edge) {
        const ret = (edge.from !== edge.to) ? [pos[edge.from], pos[edge.to]] : this.computeCircle(24, [
                pos[edge.from][0] - ((loopRadius / 2) + lineW * 2),
                pos[edge.from][1] + ((loopRadius / 2) + lineW * 2),
            ],
            loopRadius);
        return ret;
    }

    private getNodePosition(d) {
        return pos[d['id']];
    }

    private onWheel(e: React.MouseEvent<HTMLElement>) {
        e.preventDefault();
        const {camera} = this.state;
        const dz = e.nativeEvent['deltaY'] > 0 ? 50 : -50;
        const z = (camera.z + dz) <= 1 ? 1 : (camera.z + dz);
        this.setState({
            ...this.state,
            camera: {
                x: camera.x,
                y: camera.y,
                z: z,
            },
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
        const {dragging} = this.state;
        if (dragging) {
            e.preventDefault();
            const {tmpMouse: {x, y}, camera, size} = this.state;
            const view = new PerspectiveViewport({
                ...cameraBaseProps,
                far: (camera.z + 30),
                eye: [camera.x, camera.y, camera.z],
                lookAt: [camera.x, camera.y, 0],
                width: size.w,
                height: size.h,
            });
            const oP = view.unproject([x, y]);
            const nP = view.unproject([e.screenX, e.screenY]);
            const dx = oP[0] - nP[0];
            const dy = oP[1] - nP[1];
            this.setState({
                ...this.state,
                camera: {
                    x: camera.x + dx,
                    y: camera.y + dy,
                    z: camera.z,
                },
                tmpMouse: {
                    x: e.screenX,
                    y: e.screenY,
                },
            });
        }
    }

    private computeAngle(edge) {
        const p1 = {
            x: pos[edge.from][0],
            y: pos[edge.from][1],
        };

        const p2 = {
            x: pos[edge.to][0],
            y: pos[edge.to][1],
        };

        const angleRadians = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        return angleRadians;
    }

    private computeCircle(segments = 3, center = [0, 0], radius = nodeSize, _rotate = 0) {
        const ret = [];
        const diff = ((2 * Math.PI) / segments);
        for (let i = 0; i <= segments; i++) {
            const x = center[0] + radius * Math.sin(((diff * i) + (Math.PI / 2) - _rotate));
            const y = center[1] + radius * Math.cos((diff * i) + (Math.PI / 2 - _rotate));
            ret.push([x, y]);
        }
        return ret;
    }

    private makeTree() {
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
        layout.nodeSize([nodeSize * 3, nodeSize * 4]);
        layout(root);
        const p = root.descendants();
        p.forEach((n => {
            pos[n.data.id] = [n['x'], -n['y'], 0];
        }));
        this.setState({
            ...this.state,
            initialised: true,
        });
    }
}
