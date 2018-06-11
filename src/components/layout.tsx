import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mountPoints } from 'common/mount-points';

export interface Props {
}

export interface State {
}

export class Layout extends React.Component<Props, State> {
    public render() {
        return (
            <html lang="en">
            <head>
                <title>Graphs</title>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500"/>
                <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
                <link rel="stylesheet" href="/static/css/main.css"/>
            </head>
            <body>
            <main id={mountPoints.APP} className="w"/>
            <script src="/dist/app.js"/>
            </body>
            </html>
        );
    }
}

export function render(): string {
    return renderToStaticMarkup(<Layout/>);
}
