const React = require('react');
const ReactDOM = require('react-dom');

import Header from "./Header";
import Content from "./Content";

ReactDOM.render((<div>
					<Header/>
					<br/>
					<Content/>
				 </div>), 
				document.getElementById('react_app'));
