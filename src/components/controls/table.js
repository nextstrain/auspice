import React from "react";
import Radium from "radium";
import { connect } from "react-redux";
import {updateVisibility, updateBranchThickness} from "../../actions/treeProperties";
import jquery from "jquery";
import DataTable from "datatables.net";
const $ = jquery;

require('datatables.net-bs');

// built on
// https://medium.com/@zbzzn/integrating-react-and-datatables-not-as-hard-as-advertised-f3364f395dfa
@Radium
@connect((state) => ({nodes: state.tree.nodes}))
class Table extends React.Component {
    componentDidMount() {
        if (this.props.nodes){
          console.log(this.props.nodes.filter(function(d) {return d.is_terminal;}).map(function(d){return d.attr;}));
        }else{
          console.log("no nodes");
        }
    }

    componentWillReceiveProps(nextProps){
        if (nextProps.nodes){
          const tipAttrs = nextProps.nodes.filter(function(d){return d.attr['strain'];}).map(function(d){return d.attr;});
          //console.log("table:", tipAttrs);
          this.makeTable(nextProps.nodes);
        }else{
          console.log("no nodes");
        }
    }

    componentWillUnmount(){
       $('.data-table-wrapper')
       .find('table')
       .DataTable()
       .destroy(true);
    }

    shouldComponentUpdate() {
      if (this.props.nodes){
        this.makeTable(this.props.nodes);
      }
      return false;
    }

    makeTable(nodes){
        const tipAttrs = nodes.filter(function(d){return d.attr['strain'];}).map(function(d){return d.attr;});
        const columns = [];
        for (let k in tipAttrs[0]){
          columns.push({name:k, width:60, data:k, visible:((k==="strain"))?true:false});
        }
        //console.log("columns", columns);

        //** add headers to table
        const columns_list = Object.keys(tipAttrs[0]);
        var table_div = d3.select(this.refs.main);
        var thead = table_div.append("thead")
            .attr("align", "left");
        thead.append("tr")
            .selectAll("th")
            .data(columns_list)
            .enter()
            .append("th")
            .text(function(d) { return d; });

        //**table initialisation
        var table=$(this.refs.main).DataTable({
          "dom": '<"top"il>rt<"bottom"p><"clear">',
           data: tipAttrs,
           columns,
           select: true,
           bAutoWidth: true,
           //scrollX: true,
           scrollY: '200px',
           pagingType: 'full',
           ordering: false
        });

        const table_id=this.refs.main.id;
        //** add space among dataTables_length and deselect button
        d3.select('#'+this.refs.main.id+'_length.dataTables_length')
          .append('span')
          .style("display","inline-block")
          .style("width","10px")
        //** add deselect button to unselect all clicked rows
        d3.select('#'+this.refs.main.id+'_length.dataTables_length')
          .append('button')
          .attr('id','deselect_clicked')
          .attr('class','btn btn-default btn-sm')
          .text('deselect')

        var that =this;
        //** select clicked rows(single/multiple) and update tree & map
        $(this.refs.main).on('click', 'tr', function(){
            $(this).toggleClass('active');
            if ($(this).hasClass( 'active' )){
              $(this).addClass('row_selected');
            }else{
              $(this).removeClass('row_selected');
            }

            if (table.rows('.row_selected').any()){
              const clickedItems= table.rows('.active').data();
              var selectedStrains ={};
              clickedItems.each(function(virus,ii){
                selectedStrains[virus.strain]=true;
              });
              const selectedTips = that.props.nodes.map(function(d){
                return selectedStrains[d.attr.strain]?"visible":"hidden";
              });
              that.props.dispatch(updateVisibility(selectedTips));
              that.props.dispatch(updateBranchThickness());
            }
        });

        //**deselect all clicked rows and reset tree & map
        $('#deselect_clicked').on( 'click', function () {
            $('#'+table_id+' tbody tr').removeClass('active row_selected');
              const selectedTips = that.props.nodes.map(function(d){return "visible";});
              that.props.dispatch(updateVisibility(selectedTips));
              that.props.dispatch(updateBranchThickness());
        } );
        //console.log("made table");
    }

    reloadTableData(names) {
      const tipAttrs = this.props.nodes.filter(function(d){return d.attr['strain'];}).map(function(d){return d.attr;});
      const table = $('.data-table-wrapper')
                    .find('table')
                    .DataTable();
      table.clear();
      table.rows.add(tipAttrs);
      table.draw();
   }

   search(val){
    console.log("trigger search", val);
    const table = $(this.refs.main).DataTable();
    table.search(val).draw();
    const selectedItems = table.rows({search:"applied"}).data();
    const selectedStrains ={};
    selectedItems.each(function(virus,ii){
      selectedStrains[virus.strain]=true;
    });
    const selectedTips = this.props.nodes.map(function(d){
      return selectedStrains[d.attr.strain]?"visible":"hidden";
    });
    // console.log(selectedTips);
    this.props.dispatch(updateVisibility(selectedTips));
    this.props.dispatch(updateBranchThickness());
   }

   //search
   //dispatch vector with existing tips

    render() {
        //console.log("rendering table");
        return (
            <div>
                <input type="text" placeholder="Search"
                    onChange={(e) => this.search(e.target.value)}
                />
                <table cellSpacing="0" width="100%" className="table table-striped table" ref="main" />
            </div>);
    }
}


export default Table;