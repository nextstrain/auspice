### Features
* Local Branching Index (LBI) coloring can be calculated in auspice (code identical to nextflu) if specified in `color_options` (meta JSON) [#491](https://github.com/nextstrain/auspice/pull/491)

### Internals
* `get_data.sh` script updated to no longer download sequences & entropy JSONs
* action logging middleware available for debugging / development

## version 1.9.0 - 2018/01/30

### Animation
* Animations can now loop! This is selected via a toggle in the sidebar.
* While animating, the URL displays information which defines the animation (bounds, looping, cumulative, speed). This allows the animation to start automatically by linking to this URL.
* The code for the animation (i.e. the setInterval code) has been moved out of `Map` and into a separate `AnimationController` component.
* Animation is stopped & started by examining redux state, rather than with imperative controls.

### misc
* The narrative machinery has been moved forward, but this functionality is still disabled and not present in production code.
* The (rather expensive) `calendarToNumeric` calculations have become part of `state.controls` so that components no longer have to calculate them from the string form.

## version 1.8.0 - 2018/01/18

#### entropy calculated via tree
* The entropy panel data is now computed within auspice by examining mutations throughout the tree, and is throttled to improve speed under load.
* Both entropy and number of mutations are available via a toggle similar to AA/NT
* This results in `entropy.JSON` no longer being fetched.
* The entropy data is stored in redux state rather than the react component
* The D3 code has been reorganised
* Note that the entropy values are slightly different to those exported by augur in some situations - see https://github.com/nextstrain/auspice/pull/478#issuecomment-358496901

#### genotype calculated via tree
* This results in `sequences.JSON` no longer being fetched.
* Augur was updated to export `annotations` which are needed for entropy gene display.

#### middleware / react router
* All changes to the URL are now performed via middleware rather than side-effects within the action definition.
* React router has been removed
* Browser back/forward is detected via `window.addEventListener('popstate', this.onURLChanged)` which also fires on initial page load.
* Pages are selected via the `<PageSelect>` component.

#### other
* The number of proteins displayed while hovering over a branch has been limited to 7 (issue #484)
* The presence of author data is checked before display (issue #488)
* This changelog has been created and a step in the `releaseNewVersion` script added to prepend the version number upon release.



## version 1.7.2 - 2018/1/4

#### Narrative / situational report
* Functionality has been added, but is currently disabled via a flag in `globals.js`.
* This is currently rendered in a right-hand sidebar. This feature is not yet complete.

#### URL queries

* The following state has been added to the URL query:
  * filters, e.g. `f_authors=Tong_et_al,Capobianchi_et_al&f_division=kerouane`
  * genotype URLs (these were previously set as the URL but not parsed)
  * panel layout (grid/full)
* A number of bugs regarding URL query state parsing (esp with genotype colorBys) have been fixed.

## version 1.7.1 - 2017/10/31

* Added mumps acknowledgment

## version 1.7.0 - 2017/10/17
## version  - 2018/01/18
