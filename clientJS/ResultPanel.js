import React from "react";
import SkyLight from 'react-skylight';
import ReactDataGrid from "react-data-grid"
import {Toolbar,Data} from "react-data-grid-addons"
import autoBind from 'react-autobind';


// Custom Formatter component
const PopupFormat = React.createClass({

  render() {
    const i = this.props.value.i
    return (
      <div >
        <button className="btn btn-link" onClick={this.props.value.func.bind(this,i)}>Detail</button>
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

// Custom Formatter component
const DeleteLinkFormat = React.createClass({

  render() {
    const i = this.props.value.i
    return (
      <div >
        <button className="btn btn-link" onClick={this.props.value.func.bind(this,i)}>Delete</button>
      </div>);
  }
});


export default class ResultPanel extends React.Component{
    constructor(props) {
        super(props)
        this.state = {
            innerRows:[],
            cols:[],
            originalInnerRows:[],
            rows:[],
            rowNum:-1,
            filter:{},
            sortColumn: null,
            sortDirection: null
        }
        this._cols = [
            {
                key:"Name",
                name:"Result Name",
                width:150,
                resizable:true,
                sortable:true,
                filterable: true
            },
            {
                key:"Cluster",
                name:"Cluster Name",
                width:150,
                resizable:true,
                sortable:true,
                filterable: true
            },
            {
                key:"JMX",
                name:"JMX",
                width:150,
                resizable:true,
                sortable:true,
                filterable: true
            },
            {
                key:"LastModified",
                name:"LastModified",
                width:200,
                resizable:true,
                sortable:true,
                filterable: true
            },
            {
                key:"Size",
                name:"Size",
                width:120,
                resizable:true,
                sortable:true,
                filterable: true
            },
            {
                key:"Details",
                name:"",
                width:85,
                formatter:PopupFormat
            },
            {
                key:"Download",
                name:"",
                width:105,
                formatter:DownloadLinkFormat
            },
            {
                key:"Delete",
                name:"",
                width:80,
                formatter:DeleteLinkFormat
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
            if(data.res.length==0) alert("No Summary Result!")
            This.setState({rows:data["res"]})
        })

        socket.on("return_log_result",function(data){
            var table = JSON.parse(data)["res"]
            console.log(This)
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(table));
            element.setAttribute('download', This.getOuterRows()[This.state.rowNum]["Name"]+".csv");
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        })

        socket.on("return_sum_result", function(data){
            var table = JSON.parse(data)["res"]
            var header = table.split("\n")[0]
            var innerRows = table.split("\n").slice(1)
            var originalInnerRows = innerRows.slice(0)
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
            This.setState({"cols":cols,"innerRows":innerRows,"originalInnerRows":originalInnerRows})
            This.refs.res_popup.show();
        })

        socket.on("return_del_ack",function(){
            ;
        })
    }

    listResults(){
        this.socket.emit("list_sum_results")
    }

    getOuterRows(){
        return Data.Selectors.getRows(this.state);
    }

    popupRowGetter(i) {
        var d = this.state.innerRows[i]
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
                "Download":{func:this.download,i:i},
                "Delete":{func:this.delete,i:i}
            },
            this.getOuterRows()[i]
        )
    }

    popup(i,_){
        var This = this;
        this.socket.emit("get_sum_result",{"path":This.getOuterRows()[i]["Key"]})
    }

    download(i,_){
        var This = this;
        this.setState({rowNum:i});
        this.socket.emit("get_log_result",{"path":This.getOuterRows()[i]["Key"]})
    }

    delete(i,_){
        if(confirm("Do you want to delete this summary log?")){
            var Key = this.getOuterRows()[i]["Key"]
            this.socket.emit("del_sum_result",{"path":Key})
            this.setState({rows:this.state.rows.filter(function(r){return r.Key!=Key})});
        }
    }

    handleOuterGridSort(sortColumn, sortDirection){
        this.setState({sortColumn,sortDirection})
    }

    handlePopupGridSort(sortColumn, sortDirection){
        const comparer = (a, b) => {
          if (sortDirection === 'ASC') {
            return (a[sortColumn] > b[sortColumn]) ? 1 : -1;
          } else if (sortDirection === 'DESC') {
            return (a[sortColumn] < b[sortColumn]) ? 1 : -1;
          }
        }
        const innerRows = sortDirection === 'NONE' ? this.state.originalInnerRows.slice(0) : this.state.innerRows.sort(comparer);
        this.setState({ innerRows })
    }

    handleOuterFilterChange(filter) {
        let newFilters = Object.assign({}, this.state.filters);
        if (filter.filterTerm) {
          newFilters[filter.column.key] = filter;
        } else {
          delete newFilters[filter.column.key];
        }
        this.setState({ filters: newFilters });
    }

    onClearOuterFilters() {
        // all filters removed
        this.setState({filters: {} });
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
        var closeButtonStyle = {
          cursor: 'pointer',
          position: 'absolute',
          fontSize: '1.8em',
          right: '10px',
          top: '0',
          color:"#ffffff"
        };
        return (
            <div className="col-lg-12">
                <div className="text-center" >
                    <button className="btn btn-primary" onClick={this.listResults}>Refresh result list</button>
                </div>
                <br/>
                <SkyLight dialogStyles={myBigGreenDialog} closeButtonStyle={closeButtonStyle} hideOnOverlayClicked ref="res_popup" title="Summary Result" >
                    <div style={{"color":"black"}}>
                         <ReactDataGrid
                            onGridSort={This.handlePopupGridSort}
                            columns={This.state.cols}
                            rowGetter={This.popupRowGetter}
                            rowsCount={This.state.innerRows.length}
                            minHeight={330}
                        />
                    </div>
                </SkyLight>
                <div >
                    <ReactDataGrid
                        onGridSort={This.handleOuterGridSort}
                        enableCellSelect={true}
                        columns={This._cols}
                        rowGetter={This.outerRowGetter}
                        rowsCount={This.getOuterRows().length}
                        minHeight={550}
                        onAddFilter={This.handleOuterFilterChange}
                        onClearFilters={This.onClearOuterFilters}
                        toolbar={<Toolbar enableFilter={true}/>}
                    />
                </div>
            </div>
        );
    }
}