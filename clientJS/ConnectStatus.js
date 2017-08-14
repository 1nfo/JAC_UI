import React from "react";
import autoBind from 'react-autobind';



/*export default class ConnectStatus extends React.Component{
    constructor(props) {
        super(props);
        
    }

    componentDidMount(){
        var This = this
        var socket = this.props.socket

        socket.on("connect",function(){
            $('#connIcon').removeClass();
            $('#connIcon').addClass("glyphicon glyphicon-ok")
            $('#connIcon').empty()
            $('#connIcon').append(" Socket Connected") //connected
            socket.on('disconnect', function() {
                $('#connIcon').removeClass();
                $('#connIcon').addClass("glyphicon glyphicon-remove")
                $('#connIcon').empty()
                $('#connIcon').append(" Socket Disconnected") //disconnected
                This.setState({btnDisabled:true})
            });
           
        })
    }

    render() {

      
        return (
            <div className="panel panel-primary">
                
                    <div className="panel-heading">
                        Socket Connection Status
                        
                    </div>
            <div className="panel-body">
                 <span  id="connIcon" className="glyphicon"
                           style={{lineHeight:2}} aria-hidden="true"/>
           </div>   
                
            </div>);
    }
}*/

class ConnectStatus  extends React.Component{
      constructor(props) {
        super(props);
         var This = this;
         autoBind(this);
        
    }
   /* componentDidMount(){
        var This = this;
        var socket = this.props.socket;

        socket.on("connect",function(){
            $('#socketStatusVal').removeClass();
            $('#socketStatusVal').addClass("glyphicon glyphicon-ok")
            $('#socketStatusVal').empty()
            $('#socketStatusVal').append(" Socket Connected") //connected
            socket.on('disconnect', function() {
                $('#socketStatusVal').removeClass();
                $('#socketStatusVal').addClass("glyphicon glyphicon-remove");
                $('#socketStatusVal').empty();
                $('#socketStatusVal').append(" Socket Disconnected"); //disconnected
                
            });
           
        })
    }*/
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
