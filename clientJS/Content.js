import React from 'react';
import Output from './Output';
import DashBoard from './DashBoard'


export default class Content extends React.Component{
    constructor(props) {
        super(props);
    }

    componentWillMount(){
        // Use a "/test" namespace.
        // An application can open a connection on multiple namespaces, and
        // Socket.IO will multiplex all those connections on a single
        // physical channel. If you don't care about multiple channels, you
        // can set the namespace to an empty string.
        var namespace = '/redirect';

        // Connect to the Socket.IO server.
        // The connection URL has the following format:
        //     http[s]://<domain>:<port>[/<namespace>]
        var socket = this.socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);
    }

    render() {
        return (<div className="row panel-body">
                    <DashBoard socket={this.socket}/>
                    <Output ref="output"/>
                </div>);
    }
}

