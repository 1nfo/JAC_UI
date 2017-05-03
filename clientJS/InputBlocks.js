import React from "react";
import JacConfigPopup from "./JacConfigPopup"

export const InputBlock_start = React.createClass({
    render(){
        return (<div className="row panel">
                    <div className="col-md-4">
                        <div className="btn-group">
                            <button className={"btn btn-primary"} disabled={this.props.btnDisabled} onClick={this.props.createFunc}>create</button>
                            <button className={"btn btn-primary"} disabled={this.props.btnDisabled} onClick={this.props.resumeFunc}>resume</button>
                        </div>
                     </div>
                </div>);
    }
});

export const InputBlock_clusInfo = React.createClass({
    getInitialState(){
        return {"fileStatus":""};
    },

    calc(bit,enabled=true){
        if( enabled &&((1<<bit)&this.props.display)>0) return "block";
        return "none";
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
                    <div>
                        <JacConfigPopup style={{display: this.calc(0)}} config={this.props.JAC_config}
                                        socket={this.props.socket} confChange={this.props.confChange}
                                        saveBtnStyle={{display:this.calc(6,this.props.executable)}} />
                        <br/>
                        <div className="row panel" style={{display: this.calc(1)}}>
                            <div className="col-md-3"><label>Cluster Name</label></div>
                            <div className="col-md-3" >
                                <input type="text" className="form-control" onChange={this.props.nameChange}
                                       value={this.props.JAC_clusName} readOnly={this.props.readonly}/>
                            </div>
                            <div className="col-md-1" style={{display: this.calc(2)}}>
                                <button className={"btn btn-danger btn-sm"} disabled={this.props.btnDisabled}
                                   onClick={this.props.deleteFunc} style={this.props.executable?{}:{display:"none"}}>
                                   Delete
                                </button>
                            </div>
                        </div>
                        <div className="row panel" style={{display: this.calc(1)}}>
                            <div className="col-md-3"><label>Slave Num</label></div>
                            <div className="col-md-3">
                                <input id="jac_slaveNum" type="text" className="form-control" onChange={this.props.numChange}
                                       value={this.props.JAC_SLAVENUM} readOnly={this.props.readonly}/></div>
                        </div>
                        <div className="row panel" style={{display: this.calc(1)}}>
                            <div className="col-md-3"><label>Cluster Description</label></div>
                            <div className="col-md-5">
                                <textarea className="form-control" readOnly={this.props.readonly}
                                          value={this.props.JAC_clusDesc} onChange={this.props.descChange}
                                          style={{"minWidth": "100%","height":this.props.readonly?"34px":"100px"}} />
                            </div>
                        </div>
                        <div className="row panel" style={{display: this.calc(3)}}>
                            <div className="col-md-4" >
                                <p className="text-center">Your Clusters</p>
                                {this.props.clusList[0].map(function(d,i){
                                    return (
                                            <div className='panel' key={d[0]}>
                                                <input className={"btn btn-default clusToResume"}
                                                       value={d[0].split("_",1)} disabled={This.props.btnDisabled}
                                                       title={(d[1].length>0?"Description: "+d[1]+"<br/>":"")+"User: "+d[2]+"<br/>Cluster ID: "+d[0]}
                                                       onClick={This.props.clickOnResumeClus.bind(This,0,i)}
                                                       readOnly/>
                                            </div>
                                        );
                                })}
                            </div>
                            <div className="col-md-4" >
                                <p className="text-center">Others'</p>
                                {this.props.clusList[1].map(function(d,i){
                                    return (
                                            <div className='panel' key={d[0]}>
                                                <input className={"btn btn-default clusToResume"}
                                                       value={d[0].split("_",1)} disabled={This.props.btnDisabled}
                                                       title={(d[1].length>0?"Description: "+d[1]+"<br/>":"")+"User: "+d[2]+"<br/>Cluster ID: "+d[0]}
                                                       onClick={This.props.clickOnResumeClus.bind(This,1,i)}
                                                       readOnly/>
                                            </div>
                                        );
                                })}
                            </div>
                        </div>
                        <div className="row panel" style={{display: this.calc(4)}}>
                            <div className="col-md-4">
                                <button className={"btn btn-primary"} disabled={this.props.btnDisabled}
                                        onClick={this.props.confirmFunc}>confirm</button>
                            </div>
                        </div>
                    </div>
                    <div style={{display: this.calc(5,this.props.executable)}}>
                        <div className="row panel">
                            <div className="col-md-3"><label>Upload Path</label></div>
                            <div className="col-md-5">
                                <div className="input-group">
                                    <div className="input-group-btn">
                                        <label className={"btn btn-default"} disabled={this.props.btnDisabled}>
                                        Browse
                                        <input id="jac_uploadFiles" type="file" onChange={this.fileChange}
                                               name="file" style={{display: "none"}} multiple  disabled={this.props.btnDisabled}/>
                                        </label>
                                        <button className={"btn btn-primary"} disabled={this.props.btnDisabled}
                                                onClick={this.props.uploadFunc}>Upload</button>
                                    </div>
                                    <input id="uploaded_files_status" type="text" value={this.state.fileStatus}
                                           className="form-control" readOnly />
                                </div>
                            </div>
                        </div>
                        <div className="row panel" >
                            <div className="col-md-3"><label>JMX to run</label></div>
                            <div className="col-md-1"><select id="jac_JMXName"></select></div>
                        </div>
                        <div className="row panel" >
                            <div className="col-md-3"><label>Result name</label></div>
                            <div className="col-md-3"><input className="form-control" onChange={this.props.outputChange}
                                 value={this.props.JAC_outputName}></input></div>
                        </div>
                        <div className="row panel">
                            <div className="col-md-4">
                                <div className="btn-group">
                                    <button className={"btn btn-primary"} disabled={this.props.btnDisabled} onClick={this.props.runFunc}>run</button>
                                    <button className="btn btn-default" disabled={this.props.stopBtnDis} id="btn_stopRunning" onClick={this.props.stopFunc}>stop</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>);
    }
});