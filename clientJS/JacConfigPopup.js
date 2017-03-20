import React from "react";
import SkyLight from 'react-skylight';

const JacConfigPopup = React.createClass({
    getInitialState(){
        return {"json":""};
    },

    show(){
        this.setState({"json":JAC_CONFIG});
        this.refs.jac_configJson.show();
    },

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
            $.post("/post/config",{"config":jsonToSave},function(){
                location.reload()
            })
        }
    },

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
               <div id="jac_config_area">
                    <section>
                        <button className="btn btn-primary" onClick={this.show}>Configuration</button>
                    </section>
                    <SkyLight dialogStyles={myBigGreenDialog} hideOnOverlayClicked ref="jac_configJson" title="Config Json">
                        <textarea   defaultValue={this.state.json}
                                    className="form-control"
                                    ref="textarea"
                                    style={{"minWidth": "100%","minHeight":"80%"}}>
                        </textarea>
                        <br/>
                        <button className="btn btn-danger" ref="save" onClick={this.save}>save</button>
                    </SkyLight>
                </div>
            );
    }
})

export default JacConfigPopup;