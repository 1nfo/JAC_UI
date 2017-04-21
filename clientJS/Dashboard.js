import React from "react";
import autoBind from 'react-autobind';
import {InputBlock_start,InputBlock_clusInfo} from "./InputBlocks"


export default class DashBoard extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            createOrNot:1,
            JAC_clusID:"",
            JAC_SLAVENUM:"",
            JAC_clusName:"",
            JAC_clusDesc:"",
            JAC_config:"",
            JAC_user:"",
            JAC_outputName:"",
            display:0, // saveInPopup,uploads,confirm,resumeList,slvnum,delBtn,clusName,popupConfig
            readonly:false,
            btnDisabled:true,
            stopBtnDis:true,
            clusList:[],
            executable:true
        };
        var This = this;
        this.handle = {
            nameChange(e){ This.setState({JAC_clusName:e.target.value});},
            numChange(e){ This.setState({JAC_SLAVENUM:e.target.value});},
            descChange(e){ This.setState({JAC_clusDesc:e.target.value});},
            confChange(target){This.setState({JAC_config:target});},
            outputChange(e){This.setState({JAC_outputName:e.target.value})}
        }
        autoBind(this);
    }

    componentDidMount(){
        var This = this
        var socket = this.props.socket

        socket.on("connect",function(){
            $('#connIcon').removeClass();
            $('#connIcon').addClass("glyphicon glyphicon-ok")
            $('#connIcon').empty()
            $('#connIcon').append(" Connected")
            socket.on('disconnect', function() {
                $('#connIcon').removeClass();
                $('#connIcon').addClass("glyphicon glyphicon-remove")
                $('#connIcon').empty()
                $('#connIcon').append(" Disconnected")
                This.setState({btnDisabled:true})
            });
            socket.on('connect_timeout', function() {
                $('#output').append("<br/>Connection Timeout<br/>");
            });
            This.setState({btnDisabled:false})
        })

        socket.on("config_changed",function(data){
            This.setState({JAC_config:data.config})
        })

        socket.on("cluster_ids",function(data){
            var data = JSON.parse(data)
            if (data.length==0) {
                This.setState({clusList:[]})
                alert("No running instance!")
            } else {
                This.setState({clusList:data})
                $(".clusToResume").tooltip({html: true});
            }
            This.setState({btnDisabled:false});
        })

        socket.on("cluster_started",function(data){
            data = JSON.parse(data)
            This.refs.clusInfo.setState({"fileStatus":data["files"].length+" file(s) on cloud"})
            $("#jac_JMXName").empty()
            $.each(data["jmxList"],function(i,d){
                $("#jac_JMXName").append("<option value=\""+d+"\">"+d+"</option>")
            })
            This.setState({
                    btnDisabled:false,
                    display:0b0100111,
                    JAC_clusID:data["clusID"],
                    JAC_SLAVENUM:data["slaveNum"],
                    JAC_clusDesc:data["description"],
                    JAC_user:data["user"],
                    readonly:true,
                    clusList:[],
                    executable:data["executable"]
                })
        })

        socket.on("upload_done", function(data){
            data = JSON.parse(data)
            This.setState({ btnDisabled:false})
            $("#jac_JMXName").empty()
            $.each(data["jmxList"],function(i,d){
                $("#jac_JMXName").append("<option value=\""+d+"\">"+d+"</option>")
            })
            alert("succeed");
        })

        socket.on('time_out', function(){
            This.setState({ btnDisabled:false})
            alert("Instances are still initializing, check aws web console or try again later");
        })

        socket.on("cluster_stopped", function(){
            This.setState({btnDisabled:false})
        })

        socket.on("cluster_finished",function(){
            This.setState({ btnDisabled:false,stopBtnDis:true})
            $("#btn_stopRunning").removeClass("btn-danger").addClass("btn-default")
        })

        socket.on("cluster_deleted", function(){
            This.setState({display:0,btnDisabled:false})
        })
    }

    run(){
        var jmx_to_run = $("#jac_JMXName").val()
        if(this.state.JAC_SLAVENUM<1){
            alert("No slave running!")
        }
        else if(jmx_to_run==null || !jmx_to_run.match(/^[\s\S]*\.jmx$/)){
            alert("Invaild JMX file, please upload and select jmx file");
        }
        else if (this.state.JAC_outputName.length==0){
            alert("Empty output name.")
        }
        else{
            this.setState({btnDisabled:true,stopBtnDis:false});
            $("#btn_stopRunning").removeClass("btn-default").addClass("btn-danger")
            this.props.socket.emit('startRunning',
                        {"jmx_name":jmx_to_run,"clusID":this.state.JAC_clusID,"output":this.state.JAC_outputName})
        }
    }

    create(){
        this.setState({
            createOrNot:1,
            JAC_clusName:"",
            JAC_SLAVENUM:"",
            JAC_clusDesc:"",
            display:0b1010011,
            readonly:false
        });
        this.props.socket.emit("get_default_config")
    }

    resume(){
        var This = this;
        This.setState({
            createOrNot:0,
            display:0b0001000,
            JAC_SLAVENUM:""
        });
        this.props.socket.emit("get_cluster_ids")
    }

    clickOnResumeClus(index,e){
        this.setState({
            btnDisabled:true,
            JAC_clusID:this.state.clusList[index][0],
            JAC_clusName:$(e.target).val(),
            JAC_user:this.state.clusList[index][2]
        },this.confirm)
    }

    confirm(){
        var This = this;
        if(!This.state.JAC_clusName.match(/^[a-zA-Z][a-zA-Z0-9]*$/)){
            if(This.state.createOrNot==1)alert("Name needs to be letters and number only");
        }
        else if(!This.state.JAC_SLAVENUM.match(/^[1-5]$/)&&This.state.createOrNot == 1){
            alert("Invalid number, slave num should be from 1 to 5");
        }
        else {
            This.setState({btnDisabled:true});
            This.props.socket.emit("start_cluster",
                {
                    "clusName":This.state.JAC_clusName,
                    "clusID":This.state.JAC_clusID,
                    "slaveNum":This.state.JAC_SLAVENUM,
                    "description":This.state.JAC_clusDesc,
                    "create":This.state.createOrNot,
                    "user":This.state.JAC_user
                }
            )
        }
    }

    upload(){
        var This = this;
        var filesList = $("#jac_uploadFiles").prop("files")
        if(filesList.length==0) alert("No file selected!")
        else{
            This.setState({btnDisabled:true});
            var form_data = new FormData();
            form_data.append("clusID",This.state.JAC_clusID)
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
        this.setState({btnDisabled:true});
        this.props.socket.emit("terminate_cluster");
    }

    stop(){
        var id = this.state.JAC_clusID;
        $("#btn_stopRunning").removeClass("btn-danger").addClass("btn-default")
        this.setState({btnDisabled:true,stopBtnDis:true})
        this.props.socket.emit("stop_running",{"clusID":id})
    }

    render(){
        return (
                <div className="col-lg-7 panel">
                    <InputBlock_start
                        createFunc={this.create}
                        resumeFunc={this.resume}
                        {...this.state}
                    />
                    <InputBlock_clusInfo ref="clusInfo"
                        socket={this.props.socket}
                        confirmFunc={this.confirm}
                        deleteFunc={this.delete}
                        uploadFunc={this.upload}
                        stopFunc={this.stop}
                        runFunc={this.run}
                        clickOnResumeClus={this.clickOnResumeClus}
                        {...this.handle}
                        {...this.state}
                    />
                </div>
            );
    }
}