import React from 'react';
import Output from './Output';
import DashBoard from './DashBoard'
import autoBind from 'react-autobind';
import ResultPanel from "./ResultPanel"


export default class Content extends React.Component{
    constructor(props) {
        super(props);
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
        autoBind(this)
    }

    componentDidMount(){
        var This=this;
        var socket=this.socket;

        // redirect massage / console output
        This.socket.on('redirect', function(d) {
            $('#output').append(jQuery('<div />').text(d.msg).html().replace(/\n/g,"<br/>"));
            This.refs.output.refs.console.toBottom()
        });

        // redirect to other page
        This.socket.on('redirect_page', function(d){
            window.location = d.url;
        })

        socket.on('reconnect_attempt', function(){
            $('#output').append("... ")
        });
    }

    render() {
        return (<div className="row panel-body">
                    <ul className="nav nav-tabs" role="tablist">
                      <li className="nav-item active">
                        <a className="nav-link" data-toggle="tab" href="#Cluster" role="tab">Cluster</a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link" data-toggle="tab" href="#Results" role="tab">Results</a>
                      </li>
                    </ul>

                    <div className="tab-content">
                      <div className="tab-pane active" id="Cluster" role="tabpanel">
                        <br/>
                        <DashBoard socket={this.socket}/>
                        <Output ref="output"/>
                      </div>
                      <div className="tab-pane" id="Results" role="tabpanel">
                        <br/>
                        <ResultPanel socket={this.socket}/>
                      </div>
                    </div>
                </div>);
    }
}

