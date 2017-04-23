import React from "react";
import Radium from "radium";
import { connect } from "react-redux";
import {updateVisibility, updateBranchThickness} from "../../actions/treeProperties";
import computeResponsive from "../../util/computeResponsive";
import Card from "../framework/card";
import jquery from "jquery";
import DataTable from "datatables.net";
const $ = jquery;

require('datatables.net-bs');

// built on
// https://medium.com/@zbzzn/integrating-react-and-datatables-not-as-hard-as-advertised-f3364f395dfa
@Radium
@connect((state) => ({nodes: state.tree.nodes}))
class Table extends React.Component {
    getChartGeom(props) {
    const responsive = computeResponsive({
      horizontal: 1,
      vertical: .3333333,
      browserDimensions: props.browserDimensions,
      sidebar: props.sidebar
    });
    return {
      responsive,
      width: responsive.width,
      height: 500,
      padBottom: 50,
      padLeft: 15,
      padRight: 12
    };
  }

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
          if (nextProps.nodes===this.props.nodes){
            //console.log("table:", tipAttrs);
            this.makeTable(nextProps.nodes);
          }else{
             $('.data-table-wrapper')
             .find('table')
             .DataTable()
             .destroy(true);
            this.makeTable(nextProps.nodes);
          }
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
          columns.push({name:k,
                        //width:200,
                        data:k,
                        visible:((k==="div"||k==="num_date"||k==="url"))?false:true});
        }
        const column_order = {"strain":1, "authors":2, "date":3, "region":4, "country":5, "division":6}
        columns.sort(function(a,b){if (column_order[a.name]&&column_order[b.name])
                                      {return column_order[a.name]-column_order[b.name];}
                                   else if (column_order[a.name]){return -1;}
                                   else if (column_order[b.name]){return 1;}
                                   else {return 0;}
                                  }
                    );
        console.log("columns", columns);

        //** add headers to table
        const column_names = columns.map(function(d){return d.name;});
        var table_div = d3.select(this.refs.main);
        var thead = table_div.append("thead")
            .attr("align", "left");
        thead.append("tr")
            .selectAll("th")
            .data(column_names)
            .enter()
            .append("th")
            .text(function(d) { return d; });

        //**table initialisation
        $(this.refs.main).DataTable().destroy();
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
          .text('clear')

        var that =this;

        function deselect_all(){
          const selectedTips = that.props.nodes.map(function(d){return "visible";});
          that.props.dispatch(updateVisibility(selectedTips));
          that.props.dispatch(updateBranchThickness());
        }

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
            }else{
              deselect_all();
            }
        });

        //**deselect all clicked rows and reset tree & map
        $('#deselect_clicked').on( 'click', function () {
            $('#'+table_id+' tbody tr').removeClass('active row_selected');
            deselect_all();
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
        return (
          <Card title={"Metadata"}>
            <div>
                <input type="text" placeholder="Search"
                    onChange={(e) => this.search(e.target.value)}
                />
                <table cellSpacing="0" width="100%" className="table table-striped table" ref="main" />
            </div>
        </Card>);
    }
}


export default Table;