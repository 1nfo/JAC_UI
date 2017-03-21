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
                    <div className="btn-group">
                        <a href="#" className={"btn btn-default"+this.disCls()} onClick={this.props.createFunc}>create</a>
                        <a href="#" className={"btn btn-default"+this.disCls()} onClick={this.props.resumeFunc}>resume</a>
                    </div>
                </div>);
    }
});

const InputBlock_taskInfo = React.createClass({
    calc(bit){
        if(((1<<bit)&this.props.display)>0) return "block";
        return "none";
    },

    disCls(){
        if (this.props.btnDisabled>0) return " disabled";
        return "";
    },

    render(){
        var This = this;
        return (<div key="taskInfo">
                    <div id="InputBlock_taskInfo">
                        <JacConfigPopup style={{display: this.calc(0)}} saveBtnStyle={{display:this.calc(7)}}/>
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
                        <div className="row panel" id="InputRow_slaveNem" style={{display: this.calc(3)}}>
                            <div className="col-md-3"><label>Slave Num</label></div>
                            <div className="col-md-3">
                                <input id="jac_slaveNum" type="text" className="form-control" onChange={this.props.numChange}
                                       value={this.props.JAC_SLAVENUM} readOnly={this.props.readonly}/></div>
                        </div>
                        <div className="row panel" id="InputRow_resumeTasks" style={{display: this.calc(4)}}>
                            {this.props.taskList.map(function(d){
                                return (
                                        <div className='row panel' key={d}>
                                            <input className='btn btn-default taskToResume'
                                                   value={d.split("_",1)}
                                                   title={d}
                                                   onClick={This.props.clickOnResumeTask}
                                                   readOnly/>
                                        </div>
                                    );
                            })}
                        </div>
                        <div className="row panel" id="InputRow_confirmBtn" style={{display: this.calc(5)}}>
                            <a href="#" className={"btn btn-default"+this.disCls()} id='btn_taskConfirm' onClick={this.props.confirmFunc}>confirm</a>
                        </div>
                    </div>
                    <div id="InputBlock_uploadFiles" style={{display: this.calc(6)}}>
                        <div className="row panel">
                            <div className="col-md-3"><label>Upload Path</label></div>
                            <div className="col-md-4 input-group">
                                <label className="input-group-btn">
                                    <label className={"btn btn-default"+this.disCls()}>
                                    Browse
                                    <input id="jac_uploadFiles" type="file" name="file" multiple style={{display: "none"}}/>
                                    </label>
                                    <a href="#" className={"btn btn-default"+this.disCls()} id="btn_uploadTask" onClick={this.props.uploadFunc}>Upload</a>
                                </label>
                                <input id="uploaded_files_status" type="text" className="form-control col-md-1" readOnly />
                            </div>
                        </div>
                        <div className="row panel" >
                                <div className="col-md-3"><label>JMX to run</label></div>
                                <div className="col-md-1"><select id="jac_JMXName"></select></div>
                        </div>
                        <div className="row panel">
                            <div className="btn-group">
                                <a href="#" className={"btn btn-default"+this.disCls()} id="btn_runTask">run</a>
                                <a href="#" className="btn btn-default disabled" id="btn_stopRunning" onClick={this.props.stopFunc}>stop</a>
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
            display:0,
            readonly:false,
            btnDisabled:0,
            btnDisabled_stop:1,
            taskList:[]
        };
        var This = this;
        this.handle = {
            nameChange(e){ This.setState({JAC_taskName:e.target.value});},
            numChange(e){ This.setState({JAC_SLAVENUM:e.target.value});}
        }
        autoBind(this);
    }

    create(){
        this.setState({
            task_to_create:1,
            JAC_taskName:"",
            JAC_SLAVENUM:"",
            display:0b10101011,
            readonly:false,
            taskList:[]

        });
    }

    resume(){
        var This = this;
        This.setState({
            task_to_create:0,
            display:0b00010000,
            btnDisabled:1,
            JAC_SLAVENUM:"",
            taskList:[]
        });
        $("#InputRow_resumeTasks").text("")
        $.post("/post/getTaskIDs","",function(data){
            var data = JSON.parse(data)
            if (data.length==0) {
                $("#InputRow_resumeTasks").append("<div>No task running</div>")
            } else {
                This.setState({taskList:data})
                $(".taskToResume").tooltip();

            }
            This.setState({btnDisabled:0});
        }).error(function(){This.setState({btnDisabled:0});})
    }

    clickOnResumeTask(e){
        this.setState({
            JAC_taskID:$(e.target).attr("data-original-title"),
            JAC_taskName:$(e.target).val(),
            taskList:[]
        },this.confirm)
    }

    confirm(){
        var This = this;
        if(!This.state.JAC_taskName.match(/^[a-zA-Z][a-zA-Z0-9]+$/)){
            if(This.state.task_to_create==1)alert("Name needs to be letters and number only");
            else alert("Select one task to Resume")
        }
        else if(!This.state.JAC_SLAVENUM.match(/^[1-9]+[0-9]*$/)&&This.state.task_to_create == 1){
            alert("Invalid number, must be greater than 0");
        }
        else {
            This.setState({btnDisabled:1});
            var res = $.post("/post/taskName",{
                "taskName":This.state.JAC_taskName,
                "taskID":This.state.JAC_taskID,
                "slaveNum":This.state.JAC_SLAVENUM,
                "create":This.state.task_to_create
            },function(data){
                data = JSON.parse(data)
                GLOBAL_JAC_taskID = data["taskID"]
                GLOBAL_JAC_SLAVENUM = data["slaveNum"]
                $("#uploaded_files_status").val(data["files"].length+" file(s) uploaded")
                $("#jac_JMXName").empty()
                $.each(data["jmxList"],function(i,d){
                    $("#jac_JMXName").append("<option value=\""+d+"\">"+d+"</option>")
                })
                This.setState({
                        btnDisabled:0,
                        display:0b1001111|(This.state.task_to_create<<7),
                        JAC_taskID:GLOBAL_JAC_taskID,
                        JAC_SLAVENUM:GLOBAL_JAC_SLAVENUM,
                        readonly:true,
                        taskList:[]
                    })
            }).error(function(){This.setState({btnDisabled:0});})
        }
    }

    upload(){
        var This = this;
        This.setState({btnDisabled:1});
        var filesList = $("#jac_uploadFiles").prop("files")
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
                $("#uploaded_files_status").val(data["files"].length+" file(s) uploaded")
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
        $("#btn_stopRunning").addClass("disabled")
        This.setState({btnDisabled:1})
        $.post("/post/stop",{"taskID":This.state.JAC_taskID},function(data){
            This.setState({btnDisabled:0})
        }).error(function(){This.setState({btnDisabled:0});})
    }

    render(){
        return (
                <div className="col-lg-6">
                    <InputBlock_startTask
                        createFunc={this.create}
                        resumeFunc={this.resume}
                        {...this.state}
                    />
                    <InputBlock_taskInfo
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