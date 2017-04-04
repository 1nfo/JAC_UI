import React from "react";
import autoBind from 'react-autobind';
import JacConfigPopup from "./JacConfigPopup"


const InputBlock_startTask = React.createClass({
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

const InputBlock_taskInfo = React.createClass({
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
                        <JacConfigPopup style={{display: this.calc(0)}} saveBtnStyle={{display:this.calc(6)}} btnDis={this.disCls()}/>
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
                                    <a href="#" className={"btn btn-primary"+this.disCls()} id="btn_runTask">run</a>
                                    <a href="#" className="btn btn-default disabled" id="btn_stopRunning" onClick={this.props.stopFunc}>stop</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>);
    }
});


export default class DashBoard extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            task_to_create:1,
            JAC_taskID:"",
            JAC_SLAVENUM:"",
            JAC_taskName:"",
            JAC_taskDesc:"",
            display:0, // saveInpopup,uploads,confirm,resumeList,slvnum,delBtn,taskName,popupConfig
            readonly:false,
            btnDisabled:0,
            taskList:[]
        };
        var This = this;
        this.handle = {
            nameChange(e){ This.setState({JAC_taskName:e.target.value});},
            numChange(e){ This.setState({JAC_SLAVENUM:e.target.value});},
            descChange(e){ This.setState({JAC_taskDesc:e.target.value});}
        }
        autoBind(this);
    }

    create(){
        this.setState({
            task_to_create:1,
            JAC_taskName:"",
            JAC_SLAVENUM:"",
            JAC_taskDesc:"",
            display:0b1010011,
            readonly:false
        });
        $.post("/post/defaultconfig","")
    }

    resume(){
        var This = this;
        This.setState({
            task_to_create:0,
            display:0b0001000,
            btnDisabled:1,
            JAC_SLAVENUM:""
        });
        $.post("/post/getTaskIDs","",function(data){
            var data = JSON.parse(data)
            if (data.length==0) {
                alert("No running instance!")
            } else {
                This.setState({taskList:data})
                $(".taskToResume").tooltip();
            }
            This.setState({btnDisabled:0});
        }).error(function(){This.setState({btnDisabled:0});})
    }

    clickOnResumeTask(index,e){
        this.setState({
            btnDisabled:1,
            JAC_taskID:this.state.taskList[index][0],
            JAC_taskName:$(e.target).val(),
        },this.confirm)
    }

    confirm(){
        var This = this;
        if(!This.state.JAC_taskName.match(/^[a-zA-Z][a-zA-Z0-9]*$/)){
            if(This.state.task_to_create==1)alert("Name needs to be letters and number only");
            else alert("Select one task to Resume")
        }
        else if(!This.state.JAC_SLAVENUM.match(/^[1-5]$/)&&This.state.task_to_create == 1){
            alert("Invalid number, slave num should be from 1 to 5");
        }
        else {
            This.setState({btnDisabled:1});
            var res = $.post("/post/taskName",{
                "taskName":This.state.JAC_taskName,
                "taskID":This.state.JAC_taskID,
                "slaveNum":This.state.JAC_SLAVENUM,
                "description":This.state.JAC_taskDesc,
                "create":This.state.task_to_create
            },function(data){
                data = JSON.parse(data)
                GLOBAL_JAC_taskID = data["taskID"]
                GLOBAL_JAC_SLAVENUM = data["slaveNum"]
                This.refs.taskInfo.setState({"fileStatus":data["files"].length+" file(s) on cloud"})
                $("#jac_JMXName").empty()
                $.each(data["jmxList"],function(i,d){
                    $("#jac_JMXName").append("<option value=\""+d+"\">"+d+"</option>")
                })
                This.setState({
                        btnDisabled:0,
                        display:0b0100111,
                        JAC_taskID:GLOBAL_JAC_taskID,
                        JAC_SLAVENUM:GLOBAL_JAC_SLAVENUM,
                        JAC_taskDesc:data["description"],
                        readonly:true,
                        taskList:[]
                    })
            }).error(function(){This.setState({btnDisabled:0});})
        }
    }

    upload(){
        var This = this;
        var filesList = $("#jac_uploadFiles").prop("files")
        if(filesList.length==0) alert("No file selected!")
        else{
            This.setState({btnDisabled:1});
            var form_data = new FormData();
            form_data.append("taskID",This.state.JAC_taskID)
            $.each(filesList,function(i,d){form_data.append("file",d)})
            $.ajax({
                url:"/uploadFiles",
                dataType: "text",
                chache: false,
                contentType: false,
                processData: false,
                data: form_data,
                type: "post",
                success:function(data){
                    data = JSON.parse(data)
                    This.refs.taskInfo.setState({"fileStatus":filesList.length+" file(s) uploaded"})
                    $("#jac_JMXName").empty()
                    $.each(data["jmxList"],function(i,d){
                        $("#jac_JMXName").append("<option value=\""+d+"\">"+d+"</option>")
                    })
                    alert("succeed");
                },
                error:function(err){alert("failed")},
                complete:function(){This.setState({btnDisabled:0});}
            })
        }
    }

    delete(){
        var This = this;
        This.setState({btnDisabled:1});
        $.post("/post/cleanup",{"taskID":This.state.JAC_taskID},
            function(data){
                This.setState({display:0,btnDisabled:0})
            }).error(function(){This.setState({btnDisabled:0})})
    }

    stop(){
        var This = this;
        $("#btn_stopRunning").removeClass("btn-danger").addClass("btn-default disabled")
        This.setState({btnDisabled:1})
        $.post("/post/stop",{"taskID":This.state.JAC_taskID},function(data){
            This.setState({btnDisabled:0})
        }).error(function(){This.setState({btnDisabled:0});})
    }

    render(){
        return (
                <div className="col-lg-7 panel">
                    <InputBlock_startTask
                        createFunc={this.create}
                        resumeFunc={this.resume}
                        {...this.state}
                    />
                    <InputBlock_taskInfo ref="taskInfo"
                        confirmFunc={this.confirm}
                        deleteFunc={this.delete}
                        uploadFunc={this.upload}
                        stopFunc={this.stop}
                        clickOnResumeTask={this.clickOnResumeTask}
                        {...this.handle}
                        {...this.state}
                    />
                </div>
            );
    }
}