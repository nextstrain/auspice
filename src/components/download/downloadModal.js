import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import { infoPanelStyles } from "../../globalStyles";
import { FooterDescription } from "../framework/footer";
import { datasetSummary } from "../info/datasetSummary";
import { DownloadButtons } from "./downloadButtons";


// const dataUsage = [
//   `The data presented here is intended to rapidly disseminate analysis of important pathogens.
//   Unpublished data is included with permission of the data generators, and does not impact their right to publish.`,
//   `Please contact the respective authors (available via the TSV files below) if you intend to carry out further research using their data.
//   Derived data, such as phylogenies, can be downloaded below - please contact the relevant authors where appropriate.`
// ];

export const publications = {
  nextstrain: {
    author: "Hadfield et al",
    title: "Nextstrain: real-time tracking of pathogen evolution",
    year: "2018",
    journal: "Bioinformatics",
    href: "https://doi.org/10.1093/bioinformatics/bty407"
  },
  treetime: {
    author: "Sagulenko et al",
    title: "TreeTime: Maximum-likelihood phylodynamic analysis",
    journal: "Virus Evolution",
    year: "2017",
    href: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5758920/"
  },
  titers: {
    author: "Neher et al",
    titleJournalYear: "Prediction, dynamics, and visualization of antigenic phenotypes of seasonal influenza viruses",
    journal: "PNAS",
    year: "2016",
    href: "http://www.pnas.org/content/113/12/E1701.abstract"
  }
};

@connect((state) => ({
  colorBy: state.controls.colorBy,
  metadata: state.metadata,
  nodes: state.tree.nodes,
  visibility: state.tree.visibility,
}))
class DownloadModalContents extends React.Component {
  getRelevantPublications() {
    const x = [publications.nextstrain, publications.treetime];
    if (["cTiter", "rb", "ep", "ne"].indexOf(this.props.colorBy) !== -1) {
      x.push(publications.titers);
    }
    return x;
  }
  formatPublications(pubs) {
    return (
      <span>
        <ul>
          {pubs.map((pub) => (
            <li key={pub.href}>
              <a href={pub.href} target="_blank" rel="noreferrer noopener">
                {pub.author}, {pub.title}, <i>{pub.journal}</i> ({pub.year})
              </a>
            </li>
          ))}
        </ul>
      </span>
    );
  }
  render() {
    const { t, metadata } = this.props;
    const relevantPublications = this.getRelevantPublications();
    return (
      <>
        <div style={infoPanelStyles.modalSubheading}>
          {metadata.title} ({t("last updated")} {metadata.updated})
        </div>

        <div>
          {datasetSummary({
            mainTreeNumTips: this.props.metadata.mainTreeNumTips,
            nodes: this.props.nodes,
            visibility: this.props.visibility,
            t: this.props.t
          })}
        </div>
        <div style={infoPanelStyles.break}/>
        {" " + t("A full list of sequence authors is available via the TSV files below")}
        <div style={infoPanelStyles.break} />

        <div style={infoPanelStyles.modalSubheading}>
          {t("Data usage policy")}
        </div>
        {t("Data usage part 1") + " " + t("Data usage part 2")}

        <div style={infoPanelStyles.modalSubheading}>
          {t("Please cite the authors who contributed genomic data (where relevant), as well as")+":"}
        </div>
        {this.formatPublications(relevantPublications)}


        <div style={infoPanelStyles.modalSubheading}>
          {t("Download data")}:
        </div>
        <div style={{display: "block", justifyContent: "space-around", marginLeft: "25px", width: "100%" }}>
          <div style={{ width: "100%" }}>
            <DownloadButtons relevantPublications={relevantPublications}/>
          </div>
        </div>

        {metadata.description && (
          <>
            <div style={infoPanelStyles.modalSubheading}>
              {t("Dataset description")}:
            </div>
            <FooterDescription md={metadata.description} />
          </>
        )}
      </>
    );
  }
}


const WithTranslation = withTranslation()(DownloadModalContents);
export default WithTranslation;
