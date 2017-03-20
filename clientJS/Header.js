import React from "react";
import JacConfigPopup from "./JacConfigPopup"


const ToggleButton = React.createClass({
    render(){
        return (
                <a href="#menu-toggle" className="btn btn-default" style={{display: "none"}}>
                    Toggle
                </a>
            );
    }
})
const Title = React.createClass({
    render(){
        return(
                <div className="row">
                    <h1 className="text-center">{this.props.title}</h1>
                </div>
            );
    }
})


var Header = React.createClass({
    render() {
        return (
            <div >
                <ToggleButton />
                <Title title="Jmeter Cloud Testing" />
                <JacConfigPopup />
            </div> )
    }
});

export default Header;