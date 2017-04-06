import React from "react";
import JacConfigPopup from "./JacConfigPopup"

export const InputBlock_startTask = React.createClass({
    disCls(){
        if (this.props.btnDisabled>0) return " disabled";
        return "";
    },

    render(){
        return (<div className="row panel" id="InputBlock_startTask" >
                    <div className="col-md-4">
                        <div className="btn-group">
                            <a href="#" className={"btn btn-primary"+this.disCls()} onClick={this.props.createFunc}>create</a>
                            <a href="#" className={"btn btn-primary"+this.disCls()} onClick={this.props.resumeFunc}>resume</a>
                        </div>
                     </div>
                </div>);
    }
});

export const InputBlock_taskInfo = React.createClass({
    getInitialState(){
        return {"fileStatus":""};
    },

    calc(bit){
        if(((1<<bit)&this.props.display)>0) return "block";
        return "none";
    },

    disCls(){
        if (this.props.btnDisabled>0) return " disabled";
        return "";
    },

    fileChange(e){
        var input = $(e.target),
                    numFiles = input.get(0).files ? input.get(0).files.length : 1,
                    label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
                    log = numFiles > 1 ? numFiles + ' files selected' : label;
        var log = numFiles > 1 ? numFiles + ' files selected' : label;
        this.setState({"fileStatus":log})
    },

    render(){
        var This = this;
        return (<div>
                    <div id="InputBlock_taskInfo">
                        <JacConfigPopup style={{display: this.calc(0)}} config={this.props.JAC_config}
                                        socket={this.props.socket} confChange={this.props.confChange}
                                        saveBtnStyle={{display:this.calc(6)}} btnDis={this.disCls()}/>
                        <br/>
                        <div className="row panel" id="InputRow_task" style={{display: this.calc(1)}}>
                            <div className="col-md-3"><label>Task Name</label></div>
                            <div className="col-md-3" >
                                <input id="jac_taskName" type="text" className="form-control" onChange={this.props.nameChange}
                                       value={this.props.JAC_taskName} readOnly={this.props.readonly}/>
                            </div>
                            <div className="col-md-1" id="cleaup_btn_div" style={{display: this.calc(2)}}>
                                <a href="#" className={"btn btn-danger btn-sm"+this.disCls()} id="btn_cleanupTask" onClick={this.props.deleteFunc}>Del Task</a>
                            </div>
                        </div>
                        <div className="row panel" id="InputRow_slaveNem" style={{display: this.calc(1)}}>
                            <div className="col-md-3"><label>Slave Num</label></div>
                            <div className="col-md-3">
                                <input id="jac_slaveNum" type="text" className="form-control" onChange={this.props.numChange}
                                       value={this.props.JAC_SLAVENUM} readOnly={this.props.readonly}/></div>
                        </div>
                        <div className="row panel" style={{display: this.calc(1)}}>
                            <div className="col-md-3"><label>Task Description</label></div>
                            <div className="col-md-5">
                                <textarea className="form-control" readOnly={this.props.readonly}
                                          value={this.props.JAC_taskDesc} onChange={this.props.descChange}
                                          style={{"minWidth": "100%","height":this.props.readonly?"34px":"100px"}} />
                            </div>
                        </div>
                        <div className="row panel" id="InputRow_resumeTasks" style={{display: this.calc(3)}}>
                            <div className="col-md-4" >
                                {this.props.taskList.map(function(d,i){
                                    return (
                                            <div className='panel' key={d[0]}>
                                                <input className={"btn btn-default taskToResume"+This.disCls()}
                                                       value={d[0].split("_",1)}
                                                       title={d[1].length>0?"Description: "+d[1]:"Task ID: "+d[0]}
                                                       onClick={This.props.clickOnResumeTask.bind(This,i)}
                                                       readOnly/>
                                            </div>
                                        );
                                })}
                            </div>
                        </div>
                        <div className="row panel" id="InputRow_confirmBtn" style={{display: this.calc(4)}}>
                            <div className="col-md-4">
                                <a href="#" className={"btn btn-primary"+this.disCls()} id='btn_taskConfirm' onClick={this.props.confirmFunc}>confirm</a>
                            </div>
                        </div>
                    </div>
                    <div id="InputBlock_uploadFiles" style={{display: this.calc(5)}}>
                        <div className="row panel">
                            <div className="col-md-3"><label>Upload Path</label></div>
                            <div className="col-md-5">
                                <div className="input-group">
                                    <label className="input-group-btn">
                                        <label className={"btn btn-default"+this.disCls()}>
                                        Browse
                                        <input id="jac_uploadFiles" type="file" onChange={this.fileChange}
                                               name="file" style={{display: "none"}} multiple />
                                        </label>
                                        <a href="#" className={"btn btn-primary"+this.disCls()}
                                                    id="btn_uploadTask" onClick={this.props.uploadFunc}>Upload</a>
                                    </label>
                                    <input id="uploaded_files_status" type="text" value={this.state.fileStatus}
                                           className="form-control" readOnly />
                                </div>
                            </div>
                        </div>
                        <div className="row panel" >
                            <div className="col-md-3"><label>JMX to run</label></div>
                            <div className="col-md-1"><select id="jac_JMXName"></select></div>
                        </div>
                        <div className="row panel">
                            <div className="col-md-4">
                                <div className="btn-group">
                                    <a href="#" className={"btn btn-primary"+this.disCls()} id="btn_runTask" onClick={this.props.runFunc}>run</a>
                                    <a href="#" className="btn btn-default disabled" id="btn_stopRunning" onClick={this.props.stopFunc}>stop</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>);
    }
});