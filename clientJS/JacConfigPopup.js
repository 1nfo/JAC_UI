import React from "react";
import SkyLight from 'react-skylight';
import autoBind from 'react-autobind';

export default class JacConfigPopup extends React.Component{
    constructor(props){
      super(props);
      var This=this;
      this.state = {"config":{"InstType":{},"ami":{}},"json":"","json_mode":false};
      this.types = ["t2.nano","t2.micro","t2.small","t2.medium","t2.large","t2.xlarge","t2.2xlarge","m4.large","m4.xlarge","m4.2xlarge","m4.4xlarge","m4.10xlarge","m4.16xlarge","m3.medium","m3.large","m3.xlarge","m3.2xlarge","c4.large","c4.xlarge","c4.2xlarge","c4.4xlarge","c4.8xlarge","c3.large","c3.xlarge","c3.2xlarge","c3.4xlarge","c3.8xlarge","r3.large","r3.xlarge","r3.2xlarge","r3.4xlarge","r3.8xlarge","r4.large","r4.xlarge","r4.2xlarge","r4.4xlarge","r4.8xlarge","r4.16xlarge","x1.16xlarge","x1.32xlarge","d2.xlarge","d2.2xlarge","d2.4xlarge","d2.8xlarge","i2.xlarge","i2.2xlarge","i2.4xlarge","i2.8xlarge","i3.large","i3.xlarge","i3.2xlarge","i3.4xlarge","i3.8xlarge","i3.16xlarge","p2.xlarge","p2.8xlarge","p2.16xlarge","g2.2xlarge","g2.8xlarge"];
      this.changes = {
        mt:function(e){var config=This.state.config;config.InstType.master=e.target.value;This.inputChanges(config);},
        st:function(e){var config=This.state.config;config.InstType.slave=e.target.value;This.inputChanges(config);},
        sg:function(e){var config=This.state.config;config.security_groups=e.target.value.split(",");This.inputChanges(config);},
        mi:function(e){var config=This.state.config;config.ami.master=e.target.value;This.inputChanges(config);},
        si:function(e){var config=This.state.config;config.ami.slave=e.target.value;This.inputChanges(config);},
        es:function(e){var config=This.state.config;config.es_IP=e.target.value;This.inputChanges(config);}
      }
      autoBind(this);
    }

    type_append(t,i){
      return (
        <option key={i}>{t}</option>
      )
    }

    show(){
        this.setState({"json":this.props.config,"config":JSON.parse(this.props.config),"json_mode":false});
        this.refs.jac_configJson.show();
    }

    clickOnJsonBtn(){
      this.setState({"json_mode":!this.state.json_mode})
    }

    jsonDisplay(){
        return this.state.json_mode?{}:{display:"none"}
    }

    inputDisplay(){
        return this.state.json_mode?{display:"none"}:{}
    }

    btn_text(){
        return this.state.json_mode?"BACK":"SHOW JSON"
    }

    jsonChange(e){
        this.setState({"json":e.target.value,"config":JSON.parse(e.target.value)})
    }

    inputChanges(obj){
        this.setState({"config":obj,"json":JSON.stringify(obj, null, "\t")})
    }

    save(){
        var This = this
        var jsonToSave = this.refs.textarea.value;
        var IS_JSON = true;
        try{
               var json = $.parseJSON(jsonToSave);
        }catch(err){
               console.log(err)
               IS_JSON = false;
        }
        if(!IS_JSON) alert("Invaild JSON format")
        else{
            this.props.socket.emit("update_config",{"config":jsonToSave})
            this.props.socket.on("config_updated",function(d){
              if (d["success"]==1) This.props.confChange(jsonToSave)
          })
        }
    }

    render(){
        var myBigGreenDialog = {
          backgroundColor: '#00897B',
          color: '#ffffff',
          width: '70%',
          height: '550px',
          marginTop: '-300px',
          marginLeft: '-35%',
        };
        var input_class = "form-control";
        return (
               <div id="jac_config_area" style={this.props.style}>
                    <section>
                        <button className={"btn btn-success btn-sm"}
                                onClick={this.show}> Configuration
                        </button>
                    </section>
                    <SkyLight dialogStyles={myBigGreenDialog} hideOnOverlayClicked ref="jac_configJson" title="Task Configuration">
                        <div style={this.inputDisplay()}>
                          <div className="row">
                            <div className="col-lg-6"><span>Master Instance Type: </span>
                                <select value={this.state.config.InstType.master} onChange={this.changes.mt}
                                 className={input_class}>{this.types.map(this.type_append)}
                                </select></div>
                            <div className="col-lg-6"><span>Slave Instance Type: </span>
                                <select value={this.state.config.InstType.slave} onChange={this.changes.st}
                                 className={input_class}>{this.types.map(this.type_append)}
                                 </select></div>
                          </div><br/>
                          <div className="row">
                            <div className="col-lg-12"><span>Instance Security Group: </span>
                            <input value={this.state.config.security_groups} onChange={this.changes.sg} className={input_class}/></div>
                          </div><br/>
                          <div className="row">
                            <div className="col-lg-6">
                              <span>Master Image: </span>
                              <input value={this.state.config.ami.master} className={input_class} onChange={this.changes.mi}/></div>
                            <div className="col-lg-6">
                              <span>Slave Image: </span>
                              <input value={this.state.config.ami.slave} className={input_class} onChange={this.changes.si}/></div>
                          </div><br/>
                          <div className="row">
                            <div className="col-lg-12">
                              <span>Elasticsearch Server URL: </span>
                              <input value={this.state.config.es_IP} className={input_class} onChange={this.changes.es}/></div>
                          </div><br/>
                        </div>
                        <div style={this.jsonDisplay()}>
                          <span>JSON</span>
                          <textarea value={this.state.json}
                                    className="form-control"
                                    ref="textarea"
                                    onChange={this.jsonChange}
                                    style={{"minWidth": "100%","minHeight":"320px"}}></textarea><br/>
                        </div>
                        <button className="btn btn-primary pull-right" onClick={this.clickOnJsonBtn}>{this.btn_text()}</button>
                        <button className="btn btn-danger"
                                ref="save"
                                onClick={this.save}
                                style={this.props.saveBtnStyle}>
                            SAVE
                        </button>
                    </SkyLight>
                </div>
            );
    }
}