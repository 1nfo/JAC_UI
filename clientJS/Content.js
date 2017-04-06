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

    componentDidMount(){
        var socket = this.socket
        var This = this
        socket.on("connect",function(){
            $('#connIcon').removeClass();
            $('#connIcon').addClass("glyphicon glyphicon-ok")
            $('#connIcon').empty()
            $('#connIcon').append(" Connected")
            socket.on('disconnect', function() {
                $('#connIcon').removeClass();
                $('#connIcon').addClass("glyphicon glyphicon-remove")
                $('#connIcon').empty()
                $('#connIcon').append(" Disconnected")
            });
            socket.on('connect_timeout', function() {
                $('#output').append("<br/>Connection Timeout<br/>");
            });
        })

        socket.on('redirect', function(d) {
            $('#output').append(jQuery('<div />').text(d.msg).html().replace(/\n/g,"<br/>"));
            This.refs.output.refs.console.toBottom()
        });

        socket.on('reconnect_attempt', function(){
            $('#output').append("... ")
        });
    }

    render() {
        return (<div className="row panel-body">
                    <DashBoard socket={this.socket}/>
                    <Output ref="output"/>
                </div>);
    }
}

