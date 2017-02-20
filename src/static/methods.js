/*eslint-env browser*/
/*eslint max-len: 0*/
import React from "react";
// import Flex from "./framework/flex";
import TitleBar from "../components/framework/title-bar";

const Methods = () => {
  return (
		<g>
			<TitleBar/>

			<div className="static container">

				<div className="bigspacer"></div>
				<div className="row">
					<div className="col-md-3"></div>
					<h1 className="col-md-7">
            Methods
          </h1>
        </div>

				<div className="row">
					<div className="col-md-3">
						<h2>Overview</h2>
					</div>

					<div className="col-md-7">
						The data processing for nextrain consists of two stages: data collection (known as <a href="https://github.com/nextstrain/fauna">fauna</a>) and data processing (known as <a href="https://github.com/nextstrain/augur">augur</a>), each publically available and detailed on github. Here we give an overview of these methods. The data vizualisation code is known as <a href="https://github.com/nextstrain/auspice">auspice</a>.
					</div>

				</div>

				<div className="bigspacer"></div>

				<div className="row">
					<div className="col-md-3">
						<h2>Data Collection</h2>
					</div>

					<aside className="col-md-2">
						<a href="https://github.com/nextstrain/fauna">Code on GitHub</a>
					</aside>

					<div className="col-md-7">
						A database of publically available sequences is built and maintained using a number of scripts. This database, which is regularly updated, allows downloading of all zika, ebola and influenza genomes in fasta format.
					</div>
				</div>

				<div className="bigspacer"></div>

				<div className="row">
					<div className="col-md-3">
						<h2>Pruning and Alignment</h2>
					</div>

					<aside className="col-md-2">
						<a href="https://github.com/nextstrain/augur">Code on GitHub</a>
					</aside>

					<div className="col-md-7">
						The first step in the processing pipeline is to automatically select a subset of representative viruses.
						Here, viruses without complete date or geographic information, viruses passaged in eggs and sequences less than 987 bases are removed. In addition, local outbreaks are filtered by keeping only one instance of identical sequences sampled at the same location on the same day. Following filtering, the viruses are subsampled to achieve a more equitable temporal and geographic distribution. For our standard display period of 3 years and 32 viruses per month, this typically results in ~1200 viruses, which we align using <a href="http://mafft.cbrc.jp/alignment/software/">MAFFT</a>. Once aligned, the set of virus sequences is further cleaned by removing insertions relative to the outgroup to	enforce canonical HA site numbering, by removing sequences that show either too much or too little divergence relative to the expectation given sampling date, and by removing known reassortant clusters. As outgroup for each viral lineage, we chose a well characterized virus without insertions relative to the canonical amino-acid numbering and possessing a sampling date a few years before the time interval of interest.
					</div>
				</div>

				<div className="bigspacer"></div>

				<div className="row">
					<div className="col-md-3">
						<h2>Tree Building</h2>
					</div>

					<div className="col-md-7">
						From the filtered and cleaned alignment, <span className="highlight">augur</span> builds a phylogenetic tree using <a href="http://www.microbesonline.org/fasttree/">FastTree</a>, which is then further refined using <a href="http://sco.h-its.org/exelixis/web/software/raxml/index.html">RAxML</a>. Next, the state of every internal node of the tree is inferred using a marginal maximum likelihood method and missing sequence data at phylogeny tips is filled with the nearest ancestral sequence at these sites. Internal branches without mutations are collapsed into polytomies. The final tree is decorated with the attributes to be displayed in the browser.
					</div>
				</div>

				<div className="bigspacer"></div>

				{/*
				<div className="row">
					<div className="col-md-3">
						<h2>Frequency Calculation</h2>
					</div>

					<div className="col-md-7">
						<span className="highlight">augur</span> estimates the frequency trajectories of mutations, genotypes and clades in the tree.
						Frequency trajectories are represented as a linear interpolation $x(t)$ of pivot frequencies $x_i$ at time points $t_i$ spaced one month apart.
						The frequencies $x_i$ corresponding to a feature $\phi$ (e.g. mutation) are estimated by simultaneously maximizing the Bernoulli observation model
						$$
						f(\mathbf{x}) = \prod_{v\in V_\phi} x(t_v) \prod_{v\notin V_{\phi}} (1-x(t_v))
						$$
						where $V_{\phi}$ is the set of viruses carring attribute $\phi$ and $t_v$ is the collection date of virus $v$, and the process noise model
						$$
						g(\mathbf{x}) = \mathrm{exp}\left(
							-\sum_i \frac{(\Delta x_i - \epsilon\Delta x_{i-1})^2}{2\gamma \Delta t_i}
						\right)
						$$
						where $\Delta x_i = x_i-x_{i-1}$, $\Delta t_i = t_i-t_{i-1}$. Here, $\gamma$ parameterizes the smoothing imposed on the frequency estimate and $\epsilon$ parameterizes our expectation of frequency changes in interval $i$ based on the  change in interval $i-1$.
						$\epsilon=0$ implies that frequency changes are uncorrelated from one interval to the next, while $\epsilon=1$ implies that the most likely $\Delta x_i$ is $\Delta x_{i-1}$.
						We typically use $\epsilon = 0.7$.
						Here, the objective function $\mathrm{log}(f) + \mathrm{log}(g)$ is maximized using SciPys implementation of a <a href="http://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.fmin.html">downhill simplex algorithm</a>.
						To speed up convergence, optimization is first done using a coarse grid of pivot points which is subsequently refined to 12 pivots per year. Frequency estimation is done for mutations, particular genotypes, and major clades of the tree.
					</div>


				</div>
				<div className="bigspacer"></div>

				<div className="row">
					<div className="col-md-3">
						<h2>HI model fit</h2>
					</div>

					<div className="col-md-7">
						For each combination of virus $i$ and antiserum $\alpha$, we define antigenic distance as $H_{i,\alpha} = \log_2(T_{a\alpha}) - \log_2(T_{i\alpha})$, where $T_{i\alpha}$ is the antiserum titer required to inhibit virus $i$ and $T_{a\alpha}$ is the homologous titer.
						In case multiple measurements are available, we average the base 2 logarithm of the titers. When no homologous titer was available, the maximal titer was used as a proxy for the homologous titer. $H_{i,\alpha}$ is then modeled as a sum of virus avidity $c_i$, serum potency $p_\alpha$ and antigenic contribution of branches $b \in (i \ldots \alpha)$ connecting the virus and antiserum in the phylogenetic tree.
						$$
						 \Delta_{i\alpha} = p_\alpha + c_i + \sum_{b\in (i\ldots\alpha)} d_{b}
						$$
						The parameters $d_b$, $p_\alpha$, $c_i$ are then estimated by minimizing the cost function
						\begin{equation}
						\label{eq:cost}
						C = \sum_{i,\alpha} (H_{i,\alpha} - \Delta_{i,\alpha})^2 + \lambda \sum_b d_b + \gamma \sum_i c_i^2 + \delta \sum_\alpha p_\alpha^2
						\end{equation}
						subject to the constraints $d_b\geq0$. To avoid overfitting, the different parameters of the model are regularized by the last three terms in the above equation. Large titer drops are penalized with their absolute value multiplied by $\lambda$ ($\ell_1$ regularization), which results in a sparse model in which most branches have no titer drop (<a href="http://dx.doi.org/10.1109/TIT.2005.858979">Candes and Tao, 2005</a>). The antiserum potencies and virus avidities are $\ell_2$-regularized by $\gamma$ and $\delta$, penalizing very large values without enforcing sparsity. This constrained minimization can be cast into a canonical convex optimization problem and solved efficiently. In the substitution model, the sum over the path in the tree is replaced by a sum over amino acid differences in HA1. Sets of substitutions that always occur together are merged and treated as one compound substitution. The inference of the substitution model parameters is done in the same way as for the tree model (<a href="http://arxiv.org/abs/1404.4197">see Harvey et al, 2014</a>, <a href="http://mbio.asm.org/content/4/4/e00230-13.short">Sun et al, 2013</a>} for a similar approach).

						This optimization problem can be cast into a canonical quadratic programming problem which we solve using <a href="http://cvxopt.org/"><bf>cvxopt</bf></a> by M. Andersen and L. Vandenberghe.
					</div>
				</div>

				<div className="bigspacer"></div>

				<div className="row">
					<div className="col-md-3">
						<div className="io-container">
							<div className="title">
							HI model validation
							</div>
						</div>
						<div className="spacer"></div>
					</div>

					<div className="col-md-7">
						<div className="row">
							<div className="col-md-6">
								<figure>
									<img src={require("./images/HI_prediction_tree.png")} width="500" align="middle"/>
									</figure>
							</div>
							<div className="col-md-6">
								<figure>
									<img src={require("./images/HI_prediction_virus_tree.png")} width="500" align="middle"/>
								</figure>
							</div>
						</div>
						<div className="row">
							<div className="col-md-6">
								<figure>
									<img src={require("./images/HI_prediction_mutation.png")} width="500" align="middle"/>
									</figure>
							</div>
							<div className="col-md-6">
								<figure>
									<img src={require("./images/HI_prediction_virus_mutation.png")} width="500" align="middle"/>
								</figure>
							</div>
						</div>
						<div align="justify">
							Predicted log<sub>2</sub> HI titer distance vs measured HI titer distance for the tree model (top) and mutation model (bottom) fit to A(H3N2) data from the past 12 years. Validation is done either (left) by excluding 10% of all measurements, or (right) 10% of all viruses from the training data. The model is then used to predict the excluded data. The prediction errors are indicted in the figure. When predicting titers for viruses that were completely absent from the training data (right), prediction errors are larger since no virus avidities could be trained.
						</div>
					</div>
				</div>
				*/}


				<div className="bigspacer"></div>
			</div>
		</g>
	);
};

// Methods.propTypes = {
//
// }

export default Methods;
