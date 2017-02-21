/*eslint-env browser*/
/*eslint max-len: 0*/
import React from "react";
import TitleBar from "../components/framework/title-bar";


const Help = () => {
  return (
		<g>
			<TitleBar dataNameHidden={true} helpSelected={true}/>

			<div className="static container">

				<div className="bigspacer"></div>
				<div className="row">
					<div className="col-md-3"></div>
					<h1 className="col-md-9">
            Tutorial
          </h1>
        </div>

				<div className="row">
					<div className="col-md-3">
						<h2>Feature overview</h2>
					</div>

					<div className="col-md-9">
						<img src={require("./images/overview.svg")}/>
					</div>
				</div>
        <div className="bigspacer"></div>

        <div className="row">
					<div className="col-md-3">
						<h2>The date slider allows exploration of viruses isolations through time</h2>
					</div>
					<div className="col-md-9">
						<img src={require("./images/date_slider.svg")}/>
					</div>
				</div>
        <div className="bigspacer"></div>

        <div className="row">
					<div className="col-md-3">
						<h2>Color tree by sampling location</h2>
					</div>
					<div className="col-md-9">
						<img src={require("./images/geo.svg")}/>
					</div>
				</div>
        <div className="bigspacer"></div>

        <div className="row">
					<div className="col-md-3">
						<h2>Mouse-over tip</h2>
            <div className="spacer"></div>
            <div>Placing the mouse over a circle corresponding to a virus strain displays the name, sampling date, and the numerical values of the different features.</div>
          </div>
					<div className="col-md-9">
						<img src={require("./images/mouse_over_tip.png")}/>
					</div>
				</div>
        <div className="bigspacer"></div>

        <div className="row">
					<div className="col-md-3">
						<h2>Mouse-over branch</h2>
            <div className="spacer"></div>
            <div>Placing the mouse a branch ancestral to a clade will display the frequency at the date specified by the date slider. For large clades, the frequency trajectory will be shown in the "mutation and genotype frequencies" plot as the curve labeled "clade".</div>
          </div>
					<div className="col-md-9">
						<img src={require("./images/mouse_over_branch.svg")}/>
					</div>
				</div>
        <div className="bigspacer"></div>


      </div>
		</g>
	);
};

  // Methods.propTypes = {
  //
  // }

  export default Help;
