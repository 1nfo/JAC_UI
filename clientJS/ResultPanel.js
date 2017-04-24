import React from "react";
import SkyLight from 'react-skylight';
import ScrollArea from 'react-scrollbar';
import ReactDataGrid from "react-data-grid"
import autoBind from 'react-autobind';


export default class ResultPanel extends React.Component{
    constructor(props) {
        super(props)
        this.state = {
            results:[],
            cols:[],
            rows:[]
        }
        autoBind(this)
        this.socket=this.props.socket;
    }

    componentDidMount(){
        var socket = this.socket;
        var This = this;
        socket.on("return_sum_results", function(data){
            data = JSON.parse(data)
            This.setState({results:data["res"]})
        })
        socket.on("return_sum_result", function(data){
            var table = JSON.parse(data)["res"]
            var header = table.split("\n")[0]
            var rows = table.split("\n").slice(1)
            var cols = header.split(",").map(
                function(d,i){
                    var prefix = "aggregate_report_";
                    return {key:i.toString(),
                            name:d.startsWith(prefix)?d.split(prefix)[1]:d,
                            resizable:true}}
                )
            This.setState({"cols":cols,"rows":rows})
        })
    }

    listResults(){
        this.socket.emit("list_sum_results")
    }

    rowGetter(i) {
        var d = this.state.rows[i]
        var ret = {}
        var arr = d.split(",")
        for(let i=0;i<arr.length;i++){
            ret[i.toString()]=arr[i]
        }
        return ret;
    }

    show(i,e){
        this.socket.emit("get_sum_result",{"path":this.state.results[i]})
        this.refs.res_popup.show();
    }

    render(){
        var This = this;
        var myBigGreenDialog = {
          backgroundColor: '#00897B',
          color: '#ffffff',
          width: '70%',
          height: '650px',
          marginTop: '-400px',
          marginLeft: '-35%',
        };
        var scrollbarStyles = {borderRadius: 5};
        return (
            <div className="col-lg-12">
                <div >
                    <button className="btn btn-primary" onClick={this.listResults}>Refresh result list</button>
                </div>
                <br/>
                <ScrollArea style={{height:500}}
                            smoothScrolling= {true}
                            minScrollSize={40}
                            verticalScrollbarStyle={scrollbarStyles}
                            verticalContainerStyle={scrollbarStyles}
                            horizontalScrollbarStyle={scrollbarStyles}
                            horizontalContainerStyle={scrollbarStyles}
                            >
                    {
                        this.state.results.map(function(d,i){
                            return (
                                <div key="i" className="row panel col-lg-12">
                                <SkyLight dialogStyles={myBigGreenDialog} hideOnOverlayClicked ref="res_popup" title="Summary Result" >
                                    <div style={{"color":"black"}}>
                                         <ReactDataGrid
                                            columns={This.state.cols}
                                            rowGetter={This.rowGetter}
                                            rowsCount={This.state.rows.length}
                                            minHeight={530} />
                                    </div>
                                </SkyLight>
                                <h2><a onClick={This.show.bind(This,i)}>{(i+1)+". "+d.split("/")[2]}</a></h2>
                                </div>
                            );
                        })
                    }
                </ScrollArea>
            </div>
        );
    }
}