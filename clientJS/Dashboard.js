import React from "react";
import autoBind from 'react-autobind';

function disCls(dis){
    if (dis>0) return " disabled";
    return "";
}

const InputBlock_startTask = React.createClass({
    render(){
        return (<div className="row panel" id="InputBlock_startTask" >
                    <div className="btn-group">
                        <a href="#" className={"btn btn-default"+disCls(this.props.btnDis)} onClick={this.props.createFunc}>create</a>
                        <a href="#" className={"btn btn-default"+disCls(this.props.btnDis)} onClick={this.props.resumeFunc}>resume</a>
                    </div>
                </div>);
    }
});

const InputBlock_taskInfo = React.createClass({
    calc(bit){
        if(((1<<bit)&this.props.display)>0) return "block";
        return "none"
    },

    render(){
        return (<div id="InputBlock_taskInfo">
                    <div className="row panel" id="InputRow_task" style={{display: this.calc(0)}}>
                        <div className="col-md-3"><label>Task Name</label></div>
                        <div className="col-md-3"><input id="jac_taskName"/></div>
                        <div className="col-md-1" id="cleaup_btn_div" style={{display: this.calc(1)}}>
                            <a href="#" className={"btn btn-default btn-sm"+disCls(this.props.btnDis)} id="btn_cleanupTask" onClick={this.props.deleteFunc}>Del Task</a>
                        </div>
                    </div>
                    <div className="row panel" id="InputRow_slaveNem" style={{display: this.calc(2)}}>
                        <div className="col-md-3"><label>Slave Num</label></div>
                        <div className="col-md-3"><input id="jac_slaveNum"/></div>
                    </div>
                    <div className="row panel" id="InputRow_taskID" style={{display: "none"}}>
                        <div className="col-md-3"><label>Task ID</label></div>
                        <div className="col-md-1"><input id="jac_taskID" /></div>
                    </div>
                    <div className="row panel" id="InputRow_resumeTasks" style={{display: this.calc(3)}}></div>
                    <div className="row panel" id="InputRow_confirmBtn" style={{display: this.calc(4)}}>
                        <a href="#" className={"btn btn-default"+disCls(this.props.btnDis)} id='btn_taskConfirm' onClick={this.props.confirmFunc}>confirm</a>
                    </div>
                </div>);
    }
});

const InputBlock_uploadFiles = React.createClass({
    calc(bit){
        if(((1<<bit)&this.props.display)>0) return "block";
        return "none"
    },

    render(){
        return (<div id="InputBlock_uploadFiles" style={{display: this.calc(5)}}>
                    <div className="row panel">
                        <div className="col-md-3"><label>Upload Path</label></div>
                        <div className="col-md-4 input-group">
                            <label className="input-group-btn">
                                <label className={"btn btn-default"+disCls(this.props.btnDis)}>
                                Browse<input id="jac_uploadFiles" type="file" name="file" multiple style={{display: "none"}}/>
                                </label>
                                <a href="#" className={"btn btn-default"+disCls(this.props.btnDis)} id="btn_uploadTask" onClick={this.props.uploadFunc}>Upload</a>
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
                            <a href="#" className={"btn btn-default"+disCls(this.props.btnDis)} id="btn_runTask">run</a>
                            <a href="#" className="btn btn-default disabled" id="btn_stopRunning" onClick={this.props.stopFunc}>stop</a>
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
            JAC_SLAVENUM:0,
            display:0,
            btnDisabled:0,
            btnDisabled_stop:1
        };
        autoBind(this)
    }

    create(){
        $("#jac_taskName").prop('readonly', false);
        $("#jac_slaveNum").prop('readonly', false);
        this.setState({task_to_create:1,display:0b010101});
    }

    resume(){
        var This = this;
        $("#jac_taskName").val("")
        This.setState({task_to_create:0,display:0b001000,btnDisabled:1});
        $("#InputRow_resumeTasks").text("")
        $.post("/post/getTaskIDs","",function(data){
            var data = JSON.parse(data)
            if (data.length==0) {
                $("#InputRow_resumeTasks").append("<div>No task running</div>")
            } else {
                $.each(data,function(i,d){
                    var inputToAdd = " <input class='btn btn-default taskToResume' value='"+
                        d.split("_",1)+
                        "' title='"+d+"'>"
                    var divToAdd = "<div class='row panel'> </div>"
                    $(divToAdd).append($(inputToAdd).data("id",d)).appendTo("#InputRow_resumeTasks")
                })
                $(".taskToResume").click(function(e){
                    var taskID = $(e.target).data()["id"]
                    $("#jac_taskID").val(taskID)
                    $("#jac_taskName").val($(e.target).val())
                    This.confirm();
                })
                $(".taskToResume").tooltip();

            }
            This.setState({btnDisabled:0});
        }).error(function(){This.setState({btnDisabled:0});})
    }

    confirm(){
        if(!$("#jac_taskName").val().match(/^[a-zA-Z][a-zA-Z0-9]+$/)){
            if(this.state.task_to_create==1)alert("Name needs to be letters and number only");
            else alert("Select one taskToResume")
        }
        else if(!$("#jac_slaveNum").val().match(/^[1-9]+[0-9]*$/)&&this.state.task_to_create == 1){
            alert("Number must be greater than 0");
        }
        else {
            var This = this;
            This.setState({btnDisabled:1});
            var res = $.post("/post/taskName",{
                "taskName":$("#jac_taskName").val(),
                "taskID":$("#jac_taskID").val(),
                "slaveNum":$("#jac_slaveNum").val(),
                "create":this.state.task_to_create
            },function(data){
                data = JSON.parse(data)
                GLOBAL_JAC_taskID = data["taskID"]
                GLOBAL_JAC_SLAVENUM = data["slaveNum"]
                $("#jac_slaveNum").val(data["slaveNum"])
                $("#uploaded_files_status").val(data["files"].length+" file(s) uploaded")
                $("#jac_JMXName").empty()
                $.each(data["jmxList"],function(i,d){
                    $("#jac_JMXName").append("<option value=\""+d+"\">"+d+"</option>")
                })
                This.setState({btnDisabled:0,display:0b100111,JAC_taskID:GLOBAL_JAC_taskID,JAC_SLAVENUM:GLOBAL_JAC_SLAVENUM})
                $("#jac_taskName").prop('readonly', true);
                $("#jac_slaveNum").prop('readonly', true);
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
                    // d = d.name
                    // if(d.match(/^[\s\S]*\.jmx$/))
                    $("#jac_JMXName").append("<option value=\""+d+"\">"+d+"</option>")
                })
                // document.getElementById("InputBlock_execJMX").style.display = "block";
                alert("succeed");
            },
            error:function(err){alert("failed")},
            complete:function(){This.setState({btnDisabled:0});}
        })
    }

    delete(){
        var This = this;
        This.setState({btnDisabled:1});
        $.post("/post/cleanup",{"taskID":this.state.JAC_taskID},
            function(data){
                This.setState({display:0,btnDisabled:0})
            }).error(function(){This.setState({btnDisabled:0})})
    }

    stop(){
        this.setState({btnDisabled:1})
        $.post("/post/stop",{"taskID":this.state.JAC_taskID},function(data){
            this.setState({btnDisabled:0})
        }).error(function(){this.setState({btnDisabled:0})})
    }

    render(){
        return (
                <div className="col-lg-6">
                    <InputBlock_startTask
                        createFunc={this.create}
                        resumeFunc={this.resume}
                        btnDis={this.state.btnDisabled}/>
                    <InputBlock_taskInfo
                        confirmFunc={this.confirm}
                        deleteFunc={this.delete}
                        display={this.state.display}
                        btnDis={this.state.btnDisabled}/>
                    <InputBlock_uploadFiles
                        uploadFunc={this.upload}
                        stopFunc={this.stop}
                        display={this.state.display}
                        btnDis={this.state.btnDisabled}/>
                </div>
            );
    }
}