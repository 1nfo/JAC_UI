const React = require('react');

const InputBlock_startTask = (	<div className="row panel" id="InputBlock_startTask" >
                                	<div className="btn-group">
                                  		<a href="#" className="btn btn-default" id="btn_createTask">create</a>
                                  		<a href="#" className="btn btn-default" id="btn_resumeTask">resume</a>
                                	</div>
                            	</div>);

const InputBlock_taskInfo = (	<div id="InputBlock_taskInfo">	
	                                <div className="row panel" id="InputRow_task" style={{display: "none"}}>
	                                    <div className="col-md-3"><label>Task Name</label></div>
	                                    <div className="col-md-3"><input id="jac_taskName"/></div>
	                                    <div className="col-md-1" id="cleaup_btn_div" style={{display: "none"}}>
	                                       <a href="#" className="btn btn-default btn-sm" id="btn_cleanupTask">Del Task</a>
	                                    </div>
	                                </div> 
	                                <div className="row panel" id="InputRow_slaveNem" style={{display: "none"}}>
	                                    <div className="col-md-3"><label>Slave Num</label></div>
	                                    <div className="col-md-3"><input id="jac_slaveNum"/></div>
	                                </div>
	                                <div className="row panel" id="InputRow_taskID" style={{display: "none"}}>
	                                    <div className="col-md-3"><label>Task ID</label></div>
	                                    <div className="col-md-1"><input id="jac_taskID" /></div>
	                                </div>
	                                <div className="row panel" id="InputRow_resumeTasks" style={{display: "none"}}>
	                                </div>
	                                <div className="row panel" id="InputRow_confirmBtn" style={{display: "none"}}>
	                                    <a href="#" className="btn btn-default" id='btn_taskConfirm'>confirm</a>
	                                </div>
                            	</div>);

const InputBlock_uploadFiles = (<div id="InputBlock_uploadFiles" style={{display: "none"}}>
	                                <div className="row panel">
	                                    <div className="col-md-3"><label>Upload Path</label></div>
	                                    <div className="col-md-4 input-group">
	                                        <label className="input-group-btn">
	                                            <label className="btn btn-default">
	                                               Browse<input id="jac_uploadFiles" type="file" name="file" multiple style={{display: "none"}}/>
	                                            </label>
	                                            <a href="#" className="btn btn-default" id="btn_uploadTask" >Upload</a>  
	                                        </label>
	                                        <input id="uploaded_files_status" type="text" className="form-control col-md-1" readOnly /> 
	                                    </div>
	                                </div>
	                            </div>);

const InputBlock_execJMX = <div id="InputBlock_execJMX" style={{display: "none"}}>
                                <div className="row panel" >
                                    <div className="col-md-3"><label>JMX to run</label></div>
                                    <div className="col-md-1"><select id="jac_JMXName"></select></div>
                                </div>
                                <div className="row panel">
                                    <div className="btn-group">
                                      <a href="#" className="btn btn-default" id="btn_runTask">run</a>
                                      <a href="#" className="btn btn-default disabled" id="btn_stopRunning" >stop</a>
                                    </div>
                                </div>
                            </div>

const connectionStatus = (	<div className="row">
                               <span  id="connIcon" className="glyphicon" aria-hidden="true"></span>
                            	&nbsp;
                               <a href="#" className="btn btn-sm btn-default" id = "btn_clear">clear screen</a> 
                            </div>);

const output = <div className="row panel"><div id="output"></div></div>;

var Content = React.createClass({
    render() {
        return (
            <div >
                <div className="row">
                        <div className="col-lg-6" id="btn_op_area"> 
                            {InputBlock_startTask}
                            {InputBlock_taskInfo}
                            {InputBlock_uploadFiles}
                            {InputBlock_execJMX}
                        </div>
                        <div className="col-lg-6">   
                            {connectionStatus}
                        	{output}
                        </div>
                    </div>
            </div> )
    }
});

export default Content;