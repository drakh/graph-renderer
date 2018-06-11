import * as React from 'react';
// import { BezierCurveLayer } from '@deck.gl/experimental-layers';
import DeckGL, { COORDINATE_SYSTEM, PerspectiveViewport, ScatterplotLayer, PathLayer } from 'deck.gl';

const layerBaseConfig = {
    projectionMode: COORDINATE_SYSTEM.IDENTITY,
    coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
};
const cameraBaseProps = {
    focalDistance: 5,
    up: [0, 1, 0],
    fov: 75,
    near: 1,
};

const edges = {
    a: {
        from: 'a',
        to: 'a',
    },
    b: {
        from: 'a',
        to: 'b',
    },
    c: {
        from: 'a',
        to: 'c',
    },
};
const pos = {
    'a': [0, 0],
    'b': [30, -30],
    'c': [-30, -30],
};

const col = {
    'a': [255, 255, 0],
    'b': [0, 255, 255],
    'c': [255, 0, 255],
};

export interface Props {
    container: HTMLElement; // preparation nfor window resize events
}

export interface State {
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
        };
    }

    public render() {
        const {camera, size} = this.state;
        const layers = [this.createEdgesLayer(), this.createNodesLayer()];
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
                    width={size.w}
                    height={size.h}
                    viewport={view}
                    layers={layers}
                />
            </div>
        );
    }

    private createNodesLayer(): ScatterplotLayer {
        const layer = new ScatterplotLayer({
            ...layerBaseConfig,
            autoHighlight: true,
            id: `nodes-layer-`,
            data: ['a', 'b', 'c'],
            pickable: true,
            radiusScale: 6,
            radiusMinPixels: 5,
            radiusMaxPixels: 10,
            highlightColor: [255, 0, 0, 255],
            getPosition: (d) => this.getNodePosition(d),
            getColor: (d) => this.getNodeColor(d),
            getRadius: () => this.getNodeRadius(),
        });
        return layer;
    }

    private createEdgesLayer(): PathLayer {
        const layer = new PathLayer({
            ...layerBaseConfig,
            autoHighlight: true,
            id: `edges-layer-`,
            data: ['a', 'b', 'c'],
            pickable: true,
            widthMinPixels: 2,
            highlightColor: [255, 0, 0, 255],
            getPath: (d) => this.getPath(d),
        });
        return layer;
    }

    private getPath(d) {
        const edge = edges[d];
        let ret;
        if (edge.from !== edge.to) {
            ret = [pos[edge.from], pos[edge.to]];
        }
        else {
            ret = [
                pos[edge.from],
                [pos[edge.from][0] + 20, pos[edge.from][1] - 10],
                [pos[edge.from][0] + 40, pos[edge.from][1]],
                [pos[edge.from][0] + 20, pos[edge.from][1] + 10],
                pos[edge.to],
            ];
        }
        console.info(ret);
        return ret;
    }

    private getNodeRadius() {
        return 10;
    }

    private getNodePosition(d) {
        return pos[d];
    }

    private getNodeColor(d) {
        return col[d];
    }

    private onWheel(e: React.MouseEvent<HTMLElement>) {
        e.preventDefault();
        const {camera} = this.state;
        const dz = e.nativeEvent['deltaY'] > 0 ? 50 : -50;
        const z = (camera.z + dz) <= 1 ? 1 : (camera.z + dz);
        console.info();
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
}
