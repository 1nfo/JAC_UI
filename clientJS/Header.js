import React from "react";

var Header = React.createClass({
    render() {
        return (
            <div className=" panel-heading">
                <h3>Performance Availability Reliability Scalability
                    <div className="btn-group pull-right">
                        <a className="btn btn-success" href="/credential">AWS Credential</a>
                        <a className="btn btn-default" href="/logout">Logout</a>
                    </div>
                </h3>

            </div>);
    }
});

export default Header;