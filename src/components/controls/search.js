import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Autosuggest from 'react-autosuggest';

@connect(state => {
  return state.tree
})
class SearchStrains extends React.Component {
  constructor(props) {
    super();

    this.state = {
      value: "",
      suggestions: this.getSuggestions(""),
    };

    this.onChange = this.onChange.bind(this);
    this.onSuggestionsUpdateRequested = this.onSuggestionsUpdateRequested.bind(this);
  }
  static propTypes = {
    /* react */
    dispatch: PropTypes.func,
    params: PropTypes.object,
    routes: PropTypes.array,
    /* component api */
    style: PropTypes.object,
    tips: PropTypes.array
    // foo: PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
  }

  onSuggestionsUpdateRequested({ value }) {
    this.setState({
      suggestions: this.getSuggestions(value)
    });
  }
  renderSuggestion(suggestion, value) {
    // we can use value here to highlight the letters like in the old autocomplete :)
    return (
      <span>{suggestion.strain}</span>
    );
  }
  getSuggestionValue(suggestion) { // when suggestion selected, this function tells
    return suggestion.strain;                 // what should be the value of the input
  }
  getSuggestions(value) {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0 ? [] : this.props.tips.filter((tip) =>
      /* implement fuzzy search here to check for internal substring match */
      tip.strain.toLowerCase().slice(0, inputLength) === inputValue
    );
  }
  onChange(event, { newValue }) {
    this.setState({
      value: newValue
    });
  }
  getTheme() {
    return {
      container: {
        marginBottom: 20
      },
      input: {
        padding: "10px 10px",
        borderRadius: 4,
        border: "1px solid rgb(200,200,200)"

      }
      // containerOpen
      // suggestionsContainer
      // suggestion
      // suggestionFocused
      // sectionContainer
      // sectionTitle
      // sectionSuggestionsContainer
    };
  }
  render() {
    /* docs for this component: https://github.com/moroshko/react-autosuggest */
    const { value, suggestions } = this.state;
    return (
      <div>
        {
          this.props.tips ?
          <Autosuggest
            theme={this.getTheme()}
            suggestions={suggestions}
            onSuggestionsUpdateRequested={this.onSuggestionsUpdateRequested}
            getSuggestionValue={this.getSuggestionValue}
            renderSuggestion={this.renderSuggestion}
            inputProps={{
              placeholder: "search strains...",
              value,
              onChange: this.onChange
            }}/> : ""
        }
      </div>

    );
  }
}

export default SearchStrains;

/*



const mc = autocomplete(document.getElementById("straininput"))
  .keys(tips)
  .dataField("strain")
  .placeHolder("search strains...")
  .width(800)
  .height(500)
  .onSelected(highlightStrainSearch)
  .render();

const highlightStrainSearch = (tip) => {
  const strainName = (tip.strain).replace(/\//g, "");
  d3.select("#" + strainName)
    .call((d) => {
      markInTreeStrainSearch(tip);
      // virusTooltip.show(tip, d[0][0]);
    });
};

const markInTreeStrainSearch = (tip) => {
  treeplot.selectAll(".strainmatch").data([tip])
    .enter()
    .append("text")
    .attr("class", "strainmatch")
    .text((d) => {
      return "\uf069";
    });
    // .on('mouseover', function(d) {
    //     virusTooltip.show(d, this);
    // })
    // .on('mouseout', virusTooltip.hide);
  styleHighlight();
};

*/
