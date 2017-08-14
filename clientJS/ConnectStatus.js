import React from "react";
import autoBind from 'react-autobind';



class ConnectStatus  extends React.Component{
      constructor(props) {
        super(props);
         var This = this;
         autoBind(this);
        
    }
   
    render() {
        return (
            <div className="panel panel-primary">
                
                    <div className="panel-heading">
                        Socket Connection Status
                        
                    </div>
		    <div className="panel-body">
			<span id="socketStatusVal" className="glyphicon" style={{lineHeight:2}} aria-hidden="true"></span>
		   </div>	
                
            </div>);
    }
};

export default ConnectStatus;
