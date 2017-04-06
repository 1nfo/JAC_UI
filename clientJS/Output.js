import React from "react";
import ScrollArea from 'react-scrollbar';


class ConnectionStatus extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return( <div className="panel-heading">
                    <span  id="connIcon" className="glyphicon"
                           style={{lineHeight:2}} aria-hidden="true"/>
                    <a href="#" className="btn btn-default pull-right" id="btn_clear"
                                onClick={() => this.props.clearFunc()}>
                        clear screen
                    </a>
                </div>);
    }
}

const Console = React.createClass({
    toBottom(){
        this.context.scrollArea.scrollBottom();
    },

    render(){
        return <div className="panel-body" style={{"minHeight": 501}} id="output" />;
    }
})

const Output = React.createClass({
    clear(){
        $("#output").empty();
    },

    render(){
        var scrollbarStyles = {borderRadius: 5};
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
                </div>)
    }
});

Console.contextTypes = {
    scrollArea: React.PropTypes.object
}

export default Output;