import React from "react";
import SkyLight from 'react-skylight';
import autoBind from 'react-autobind';

export default class JacConfigPopup extends React.Component{
    constructor(props){
      super(props);
      this.state = {"json":""};
      autoBind(this);
    }

    show(){
        this.setState({"json":JAC_CONFIG});
        this.refs.jac_configJson.show();
    }

    save(){
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
            $.post("/post/config",{"config":jsonToSave})
        }
    }

    render(){
        var myBigGreenDialog = {
          backgroundColor: '#00897B',
          color: '#ffffff',
          width: '70%',
          height: '600px',
          marginTop: '-300px',
          marginLeft: '-35%',
        };
        return (
               <div id="jac_config_area" style={this.props.style}>
                    <section>
                        <button className="btn btn-primary btn-sm"
                                onClick={this.show}> Configuration
                        </button>
                    </section>
                    <SkyLight dialogStyles={myBigGreenDialog} hideOnOverlayClicked ref="jac_configJson" title="Config Json">
                        <textarea   defaultValue={this.state.json}
                                    className="form-control"
                                    ref="textarea"
                                    style={{"minWidth": "100%","minHeight":"80%"}}>
                        </textarea>
                        <br/>
                        <button className="btn btn-danger"
                                ref="save"
                                onClick={this.save}
                                style={this.props.saveBtnStyle}>
                            save
                        </button>
                    </SkyLight>
                </div>
            );
    }
}