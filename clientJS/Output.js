import React from "react";
import ScrollArea from 'react-scrollbar';
import ConnectStatus from "./ConnectStatus";

class ConnectionStatus extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return( <div className="panel-heading">
                    <span  id="connIcon" className="glyphicon"
                           style={{lineHeight:2}} aria-hidden="true"/>
                    <button className="btn btn-default pull-right" id="btn_clear"
                                onClick={() => this.props.clearFunc()}>
                        Clear Screen
                    </button>
                </div>);
    }
}

const Console = React.createClass({
    toBottom(){
        this.context.scrollArea.scrollBottom();
    },

    render(){
        return <div className="panel-body" style={{"minHeight": 501,"minWidth": "100%"}} id="output" />;
    }
})

const Output = React.createClass({
    clear(){
        $("#output").empty();
    },

    render(){
        var scrollbarStyles = {borderRadius: 5};
        var socket = this.props.socket;



        return (<div className="col-lg-5">
                    <div className="panel panel-primary">
                        <ConnectionStatus clearFunc={this.clear}/>
                        <ScrollArea style={{height:500}}
                                    smoothScrolling= {true}
                                    minScrollSize={40}
                                    verticalScrollbarStyle={scrollbarStyles}
                                    verticalContainerStyle={scrollbarStyles}
                                    horizontalScrollbarStyle={scrollbarStyles}
                                    horizontalContainerStyle={scrollbarStyles}
                                    >
                            <Console ref="console"/>
                        </ScrollArea>


                    </div>
                    <ConnectStatus socket={this.socket}/>


                </div>)
    }
});

Console.contextTypes = {
    scrollArea: React.PropTypes.object
}

export default Output;