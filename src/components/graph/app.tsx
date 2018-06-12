import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { mountPoints } from '../../common/mount-points';
import { Graph } from './graph';
import { nodes, edges } from 'data/data';

const appEntryPoint = document.getElementById(mountPoints.APP);
if (appEntryPoint) {
    ReactDOM.render((<Graph
        container={appEntryPoint}
        nodes={nodes}
        edges={edges}
    />), appEntryPoint);
}
