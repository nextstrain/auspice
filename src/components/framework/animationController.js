import React from "react";
import { connect } from "react-redux";
import { animationWindowWidth, animationTick } from "../../util/globals";
import { numericToCalendar } from "../../util/dateHelpers";
import { changeDateFilter } from "../../actions/tree";
import { MAP_ANIMATION_PLAY_PAUSE_BUTTON, MIDDLEWARE_ONLY_ANIMATION_STARTED } from "../../actions/types";
import { timerStart, timerEnd } from "../../util/perf";

@connect((state) => ({
  animationPlayPauseButton: state.controls.animationPlayPauseButton,
  absoluteDateMaxNumeric: state.controls.absoluteDateMaxNumeric,
  absoluteDateMinNumeric: state.controls.absoluteDateMinNumeric,
  dateMinNumeric: state.controls.dateMinNumeric,
  dateMaxNumeric: state.controls.dateMaxNumeric,
  mapAnimationCumulative: state.controls.mapAnimationCumulative,
  mapAnimationShouldLoop: state.controls.mapAnimationShouldLoop,
  mapAnimationDurationInMilliseconds: state.controls.mapAnimationDurationInMilliseconds
}))
class AnimationController extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    this.maybeAnimate();
  }
  componentDidUpdate() {
    /* check that things are loaded?!?! */
    this.maybeAnimate();
  }
  render() {
    return null;
  }
  maybeAnimate() {
    /* we trigger animation when 2 criteria are met:
    (1) this.props.animationPlayPauseButton shows "Pause"
    (2) window.NEXTSTRAIN.animationTickReference (the setInterval reference) is _not_ set (i.e. there is no currently running loop).

    The animation is stopped by the tick (loop) function when the redux state demands. I.e. this.props.animationPlayPauseButton === "Play"

    dates are num date format
    leftWindow --- rightWindow ------------------------------- end
    2011.4 ------- 2011.6 ------------------------------------ 2015.4
    */
    if (this.props.animationPlayPauseButton !== "Pause" || window.NEXTSTRAIN.animationTickReference) {
      return;
    }

    /* the animation increment (and the window range) is based upon the total range of the dataset, not the selected timeslice */
    const totalDatasetRange = this.props.absoluteDateMaxNumeric - this.props.absoluteDateMinNumeric; // years in the animation
    const animationIncrement = (animationTick * totalDatasetRange) / this.props.mapAnimationDurationInMilliseconds; // [(ms * years) / ms] = years eg 100 ms * 5 years / 30,000 ms =  0.01666666667 years
    const windowRange = animationWindowWidth * totalDatasetRange;

    /* the animation can resume, i.e. the start & end bounds have been set, and we continue advancing towards them,
    or the animation starts afresh and sets the bounds as the current time slice.
    We resume if the current time slice < 2 * windowRange (and the bounds were set)
    if the time slice < 2 * windowRange (i.e. a small amount) and the bounds are NOT set, then set the upper bound to the max of the dataset */
    if ((this.props.dateMaxNumeric - this.props.dateMinNumeric) < 1.3 * windowRange) {
      if (!(window.NEXTSTRAIN.animationStartPoint && window.NEXTSTRAIN.animationEndPoint)) {
        window.NEXTSTRAIN.animationStartPoint = this.props.dateMinNumeric;
        window.NEXTSTRAIN.animationEndPoint = this.props.absoluteDateMaxNumeric;
      }
    } else {
      window.NEXTSTRAIN.animationStartPoint = this.props.dateMinNumeric;
      window.NEXTSTRAIN.animationEndPoint = this.props.dateMaxNumeric;
    }
    let leftWindow = this.props.dateMinNumeric;
    let rightWindow = leftWindow + windowRange;

    /* update the URL - no reducer uses this action type */
    this.props.dispatch({type: MIDDLEWARE_ONLY_ANIMATION_STARTED});

    /* tickFn is a closure, therefore defined within maybeAnimateMap */
    const tickFn = () => {
      // console.log("TICK")
      // if (enableAnimationPerfTesting) { window.Perf.bump(); }
      timerStart("animation tick");

      /* Check (via redux) if animation should not continue. This happens when the pause or reset button has been hit. */
      if (this.props.animationPlayPauseButton === "Play") {
        // console.log("STOP. Reason: redux told me to!. Clearing loop #", window.NEXTSTRAIN.animationTickReference);
        clearInterval(window.NEXTSTRAIN.animationTickReference);
        window.NEXTSTRAIN.animationTickReference = null;
        // if (enableAnimationPerfTesting) { window.Perf.resetCount(); }
        timerEnd("animation tick");
        return;
      }

      /* the main aim of this function is to simply update the dates in redux and then shift the values for the next tick */
      this.props.dispatch(changeDateFilter({newMin: numericToCalendar(leftWindow), newMax: numericToCalendar(rightWindow), quickdraw: true}));
      if (!this.props.mapAnimationCumulative) {
        leftWindow += animationIncrement;
      }
      rightWindow += animationIncrement;
      timerEnd("animation tick");
      /* another way the animation can stop is when the animationEndPoint has been exceeded. We must then loop or stop */
      if (rightWindow >= window.NEXTSTRAIN.animationEndPoint) {
        if (this.props.mapAnimationShouldLoop) { /* if we are looping, just reset the leftWindow to the startPoint */
          // console.log("LOOP.")
          leftWindow = window.NEXTSTRAIN.animationStartPoint;
          rightWindow = leftWindow + windowRange;
        } else { /* Animations finished! Reset the timeframe to that when the animation was started */
          // console.log("STOP. Reason: exceeded bounds. animationTickReference #", window.NEXTSTRAIN.animationTickReference);
          clearInterval(window.NEXTSTRAIN.animationTickReference);
          window.NEXTSTRAIN.animationTickReference = null;
          this.props.dispatch({type: MAP_ANIMATION_PLAY_PAUSE_BUTTON, data: "Play"});
          this.props.dispatch(changeDateFilter({
            newMin: numericToCalendar(window.NEXTSTRAIN.animationStartPoint),
            newMax: numericToCalendar(window.NEXTSTRAIN.animationEndPoint),
            quickdraw: false
          }));
          /* also trash the start/end bounds, as the animation has finished of its own accord */
          window.NEXTSTRAIN.animationStartPoint = undefined;
          window.NEXTSTRAIN.animationEndPoint = undefined;
        }
      }
    };

    /* start the animation */
    window.NEXTSTRAIN.animationTickReference = setInterval(tickFn, animationTick);
    // console.log("SETINTERVAL START. Loop (#", window.NEXTSTRAIN.animationTickReference, "), skipping setInterval");
  }
}

export default AnimationController;
