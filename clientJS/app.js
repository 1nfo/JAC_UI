import React from 'react';
import ReactDOM from 'react-dom';
import Header from "./Header";
import Content from "./Content";

ReactDOM.render((<div >
                    <a href="#menu-toggle" className="btn btn-default" style={{display: "none"}}> Toggle </a>
                    <div className=" panel-primary panel">
                        <Header/>
                        <br/>
                        <Content/>
                    </div>
                </div>),
                document.getElementById('react_app'));
