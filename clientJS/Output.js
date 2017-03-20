import React from "react"

const ConnectionStatus = React.createClass({
    render(){
        return( <div className="row">
                    <span  id="connIcon" className="glyphicon" aria-hidden="true"></span>
                    &nbsp;&nbsp;&nbsp;
                    <a href="#" className="btn btn-sm btn-default" id="btn_clear" onClick={() => this.props.clearFunc()}>clear screen</a>
                </div>);
    }
});

const Output = React.createClass({
    clear(){
        $("#output").empty();
    },

    render(){
        return (<div className="col-lg-6">
                    <ConnectionStatus clearFunc={this.clear}/>
                    <div className="row panel"><div id="output"></div></div>
                </div>)
    }
});

export default Output;