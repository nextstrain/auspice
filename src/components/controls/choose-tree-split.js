import React from "react";
import Toggle from "./toggle";
import { withTranslation } from "react-i18next";
// todo: connect if needed

/* Implements a button which splits the tree into visual trees per strain. */
class ChooseTreeSplit extends React.Component {
    render() {
        const { t } = this.props;
        return (
            <div style={{margin: 5}}>
                <Toggle
                  display={true}
                  callback={() => console.log("test")}
                  label={t("sidebar:Split tree by colored-by trait")}
                />
            </div>
        );
    }
}

const WithTranslation = withTranslation()(ChooseTreeSplit);
export default WithTranslation;