const React = require('react');

const toggleButton = <a href="#menu-toggle" className="btn btn-default" id="menu-toggle" style={{display: "none"}}>Toggle</a>;
const title = <div className="row"><h1 className="text-center">Jmeter Cloud Testing</h1></div>;

// work with jquery popup
const jacConfigPopup = (<div  id="jac_config_area">                  
                            <button className="jac_configJson_open">Configuration Json</button>
                            <div id="jac_configJson">
                                <textarea cols="100" rows="25" id="jac_config_testArea"></textarea>
                                <br/>
                                <button id="jac_config_save">save and fresh</button>
                                <button className="jac_configJson_close">close</button>
                            </div>
                        </div>)

var Header = React.createClass({
    render() {
        return (
            <div >
                {toggleButton}
                {title}
                {jacConfigPopup}
            </div> )
    }
});

export default Header;