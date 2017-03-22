import React from 'react';
import Output from './Output';
import DashBoard from './DashBoard'


export default class Content extends React.Component{
    constructor(props) {
        super(props);
    }

    render() {
        return (<div className="row panel-body">
                    <DashBoard />
                    <Output />
                </div>);
    }
}

