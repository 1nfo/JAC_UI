import React from "react";
import SkyLight from 'react-skylight';
import ReactDataGrid from "react-data-grid"
import autoBind from 'react-autobind';


// Custom Formatter component
const PopupFormat = React.createClass({

  render() {
    const i = this.props.value.i
    return (
      <div >
        <button className="btn btn-link" onClick={this.props.value.func.bind(this,i)}>Details</button>
      </div>);
  }
});

// Custom Formatter component
const DownloadLinkFormat = React.createClass({

  render() {
    const i = this.props.value.i
    return (
      <div >
        <button className="btn btn-link" onClick={this.props.value.func.bind(this,i)}>Download</button>
      </div>);
  }
});


export default class ResultPanel extends React.Component{
    constructor(props) {
        super(props)
        this.state = {
            popups:true,
            originalResults:[],
            results:[],
            cols:[],
            originalRows:[],
            rows:[],
            rowNum:-1
        }
        this._cols = [
            {
                key:"Name",
                name:"Name",
                width:200,
                resizable:true,
                sortable:true
            },
            {
                key:"LastModified",
                name:"LastModified",
                width:250,
                resizable:true,
                sortable:true
            },
            {
                key:"Size",
                name:"Size",
                width:150,
                resizable:true,
                sortable:true
            },
            {
                key:"Details",
                name:"",
                width:120,
                formatter:PopupFormat
            },
            {
                key:"Download",
                name:"",
                width:120,
                formatter:DownloadLinkFormat
            }
        ]
        autoBind(this)
        this.socket=this.props.socket;
    }

    componentDidMount(){
        var socket = this.socket;
        var This = this;
        socket.on("return_sum_results", function(data){
            data = JSON.parse(data)
            This.setState({results:data["res"],originalResults:data["res"].slice(0)})
        })
        socket.on("return_sum_result", function(data){
            var table = JSON.parse(data)["res"]
            if (This.state.popups){
                var header = table.split("\n")[0]
                var rows = table.split("\n").slice(1)
                var originalRows = rows.slice(0)
                var cols = header.split(",").map(
                    function(d,i){
                        var prefix = "aggregate_report_";
                        return {
                            key:i.toString(),
                            name:d.startsWith(prefix)?d.split(prefix)[1]:d,
                            resizable:true,
                            sortable:true
                        }
                    })
                This.setState({"cols":cols,"rows":rows,"originalRows":originalRows})
                This.refs.res_popup.show();
            }
            else {
                var element = document.createElement('a');
                element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(table));
                element.setAttribute('download', This.state.results[This.state.rowNum]["Name"]+".csv");
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
            }
        })
    }

    listResults(){
        this.socket.emit("list_sum_results")
    }

    popupRowGetter(i) {
        var d = this.state.rows[i]
        var ret = {}
        var arr = d.split(",")
        for(let i=0;i<arr.length;i++){
            ret[i.toString()]=arr[i]
        }
        return ret;
    }

    outerRowGetter(i){
        return Object.assign(
            {
                "Details":{func:this.popup,i:i},
                "Download":{func:this.download,i:i}
            },
            this.state.results[i]
        )
    }

    popup(i,_){
        this.setState({popups:true});
        this.socket.emit("get_sum_result",{"path":this.state.results[i]["Key"]})
    }

    download(i,_){
        this.setState({popups:false,rowNum:i});
        this.socket.emit("get_sum_result",{"path":this.state.results[i]["Key"]})
    }

    handleOuterGridSort(sortColumn, sortDirection){
        const comparer = (a, b) => {
          if (sortDirection === 'ASC') {
            return (a[sortColumn] > b[sortColumn]) ? 1 : -1;
          } else if (sortDirection === 'DESC') {
            return (a[sortColumn] < b[sortColumn]) ? 1 : -1;
          }
        }
        const results = sortDirection === 'NONE' ? this.state.originalResults.slice(0) : this.state.results.sort(comparer);
        this.setState({ results })
    }

    handlePopupGridSort(sortColumn, sortDirection){
        const comparer = (a, b) => {
          if (sortDirection === 'ASC') {
            return (a[sortColumn] > b[sortColumn]) ? 1 : -1;
          } else if (sortDirection === 'DESC') {
            return (a[sortColumn] < b[sortColumn]) ? 1 : -1;
          }
        }
        const rows = sortDirection === 'NONE' ? this.state.originalRows.slice(0) : this.state.rows.sort(comparer);
        this.setState({ rows })
    }

    render(){
        var This = this;
        var myBigGreenDialog = {
          backgroundColor: '#337ab7',
          color: '#ffffff',
          width: '70%',
          height: '450px',
          marginTop: '-250px',
          marginLeft: '-35%',
        };
        return (
            <div className="col-lg-12">
                <div className="text-center" >
                    <button className="btn btn-primary" onClick={this.listResults}>Refresh result list</button>
                </div>
                <br/>
                <SkyLight dialogStyles={myBigGreenDialog} hideOnOverlayClicked ref="res_popup" title="Summary Result" >
                    <div style={{"color":"black"}}>
                         <ReactDataGrid
                            onGridSort={This.handlePopupGridSort}
                            columns={This.state.cols}
                            rowGetter={This.popupRowGetter}
                            rowsCount={This.state.rows.length}
                            minHeight={330} />
                    </div>
                </SkyLight>
                <div >
                    <ReactDataGrid
                        onGridSort={This.handleOuterGridSort}
                        columns={This._cols}
                        rowGetter={This.outerRowGetter}
                        rowsCount={This.state.results.length}
                        minHeight={550} />
                </div>
            </div>
        );
    }
}