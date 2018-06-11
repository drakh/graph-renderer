import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { mountPoints } from '../../common/mount-points';
import { Graph } from './graph';

const appEntryPoint = document.getElementById(mountPoints.APP);
if (appEntryPoint) {
    ReactDOM.render((<Graph
        container={appEntryPoint}
    />), appEntryPoint);
}
