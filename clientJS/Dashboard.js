import React from "react";
import autoBind from 'react-autobind';
import {InputBlock_startTask,InputBlock_taskInfo} from "./InputBlocks"


export default class DashBoard extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            task_to_create:1,
            JAC_taskID:"",
            JAC_SLAVENUM:"",
            JAC_taskName:"",
            JAC_taskDesc:"",
            JAC_config:"",
            display:0, // saveInpopup,uploads,confirm,resumeList,slvnum,delBtn,taskName,popupConfig
            readonly:false,
            btnDisabled:0,
            taskList:[]
        };
        var This = this;
        this.handle = {
            nameChange(e){ This.setState({JAC_taskName:e.target.value});},
            numChange(e){ This.setState({JAC_SLAVENUM:e.target.value});},
            descChange(e){ This.setState({JAC_taskDesc:e.target.value});},
            confChange(target){ This.setState({JAC_config:target});}
        }
        autoBind(this);
    }

    runTask(){
        var jmx_to_run = $("#jac_JMXName").val()
        if(this.state.JAC_SLAVENUM<1){
            alert("No slave running!")
        }
        else if(jmx_to_run==null || !jmx_to_run.match(/^[\s\S]*\.jmx$/)){
            alert("Invaild JMX file, please upload and select jmx file");
        }else{
            this.setState({btnDisabled:1});
            $("#btn_stopRunning").removeClass("btn-default disabled").addClass("btn-danger")
            this.props.socket.emit('startRunning', {"jmx_name":jmx_to_run,"taskID":this.state.JAC_taskID})
        }
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
                This.refs.taskInfo.setState({"fileStatus":data["files"].length+" file(s) on cloud"})
                $("#jac_JMXName").empty()
                $.each(data["jmxList"],function(i,d){
                    $("#jac_JMXName").append("<option value=\""+d+"\">"+d+"</option>")
                })
                This.setState({
                        btnDisabled:0,
                        display:0b0100111,
                        JAC_taskID:data["taskID"],
                        JAC_SLAVENUM:data["slaveNum"],
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
                type: "post"
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
                        runFunc={this.runTask}
                        clickOnResumeTask={this.clickOnResumeTask}
                        {...this.handle}
                        {...this.state}
                    />
                </div>
            );
    }
}