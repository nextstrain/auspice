## version 1.17.3 - 2018/04/04

* Allowed arbitrary user manifests to be served
* Changed how the tanglegram updates, so that it is now triggered straight after the trees update.
* Updated the files downloaded from `get_data.sh`
* Add lassa (LASV) footer acknowledgments.

## version 1.17.2 - 2018/04/02
* Job ad on splash page.

## version 1.17.1 - 2018/03/28
* Fix tree SVG bug [Issue 535](https://github.com/nextstrain/auspice/issues/535)

## version 1.17.0 - 2018/03/26

#### Narrative
* Now exposed via a "hidden" URL query. E.g. `flu/h3n2/3y?n=1`
* Frequencies added to narrative
* block in focus is part of the URL query, and can be reloaded via the URL

#### Second Tree / Tanglegram
* Second tree can be loaded via a URL (e.g. `?tt=na`). Sidebar dropdown currently disabled.
* In this mode, trees are forced to be rectangular, and the map & frequencies are not displayed.
* Tanglegram exists, but no untangling (yet)
* Bugs still exist (which is why the sidebar has been disabled)

#### Internals
* All JSONs (incl. frequencies, narrative) are loaded within a single Promise & dispatch
* `phylotree.change()` only ever called once, and always in componentDidUpdate (fixes bugs where it fired in both CWRP and CDU)
* old & deprecated code removed


## version 1.16.5 - 2018/03/26
* Authors filter is now an explicit setting in the JSONs [PR 532](https://github.com/nextstrain/auspice/pull/532)


## version 1.16.4 - 2018/03/22
* Flu footer updated
* Fix bug in genotype colouring [PR 531](https://github.com/nextstrain/auspice/pull/531)
* Adjust vaccine cross styling & remove dashed line [PR 529](https://github.com/nextstrain/auspice/pull/529)


## version 1.16.3 - 2018/03/21
* Flu footer updated


## version 1.16.2 - 2018/03/21
* Add redirect of www.nextstrain.org to nextstrain.org via express middleware [PR 528](https://github.com/nextstrain/auspice/pull/528)


## version 1.16.1 - 2018/03/16
* Fix bug in the color scales where clades were coloured white after switching trees.


## version 1.16.0 - 2018/03/16
### Browser support
* Now works on Internet Explorer 11 (tested on windows 7)
* Grid layout issue fixed for Firefox on linux/windows
* Embedding Nextstrain in an iFrame works - see `/scripts/gisaid_iframe.html`


## version 1.15.1 - 2018/03/14
* Fix Firefox branch / tip hover bug [Issue 525](https://github.com/nextstrain/auspice/issues/525)


## version 1.15.0 - 2018/03/12
* Multiple genotypes (for the same amino acid) by typing in multiple comma separated AA/nuc positions.
[PR 523](https://github.com/nextstrain/auspice/pull/523).


## version 1.14.4 - 2018/03/05
* Restore staging server toggle [issue 514](https://github.com/nextstrain/auspice/issues/514)


## version 1.14.3 - 2018/03/01
* Bug fix where tip colours reverted to their initial colours after a layout change. [issue 519](https://github.com/nextstrain/auspice/issues/519)

## version 1.14.2 - 2018/02/28
* [PR 518](https://github.com/nextstrain/auspice/pull/518)
    * Frequency y-axis is now dynamic
    * Frequency text box is more readable
    * Frequency normalisation has been removed

## version 1.14.1 - 2018/02/27
* Style tip stroke separately from branch stroke (`node.stroke` replaced with `node.branchStroke` & `node.tipStroke`)

## version 1.14.0 - 2018/02/27

### Features
* Strain search (using [awesomplete](https://leaverou.github.io/awesomplete/)).
This highlights the path to a single tip and increases the tip radius.
Strain is stored in the URL query (`s=...`) and can be restored via URL.
Selected strain also appears in the info panel (top of screen).
* Amino acid branch labels (for every tree) as well as clade labels if specified by the `clade_annotation` attribute.
AA labels are shown where the descendent visible tips account for more than 5% of the total visible tips (same as nextflu).
Clade labels are always displayed.
* Default geneotype gene is now HA1 if available (previously nucleotide).
* ColorBy ordering (sidebar dropdown) is now ordered (via an array in `globals.js`)

### Internals
* The JSON processing on initial load has been shifted from the reducers to a single action - fewer dispatches, fewer potential bugs, faster code.
* Frequencies are initialised in a single action (previously 2).
* tip-frequencies are now downloaded via `get_data.sh`
* Frequency actions are not dispatched unless the frequency panel is loaded.

## version 1.13.2 - 2018/02/26
* Improve consistency of panel controls
* Show `unassigned` in tree legend (if applicable)

## version 1.13.1 - 2018/02/26
* Tree button "reset layout" now at top right

## version 1.13.0 - 2018/02/26

### Features
* Frequencies are now displayed via a stream graph panel - see [PR 497](https://github.com/nextstrain/auspice/pull/497).
These require the fetching of a separate `tip-frequencies` JSON, and must be specified in the `panels` array of the meta.JSON.
* "Panels To Display" toggles in the sidebar allow customisation of the display, and this is reflected in the URL.
* The `+` `-` buttons in the tree have been replaced by a "reset tree" button.
This resets the bounds to the entire tree & completely re-renders the tree (filters are maintained).
Pan behaviour is unchanged.

### Internals
* React-PhyloTree interface is completely rewritten to use `phylotree.change()` - see [PR 501](https://github.com/nextstrain/auspice/pull/501) for the API.
The new interface is both easier to understand and quicker.
* `changePageQuery` (used for changing narrative blocks) is now a single action
* Ongoing narrative work (still disabled).
* React sidebar has been removed (no UI changes).

## version 1.12.0 - 2018/02/14

### Features
* Vaccine strains are shown at their use date (in temporal trees), with dotted lines connecting them to their tips (representing collection date) ([PR 498](https://github.com/nextstrain/auspice/pull/498))

### Internals
* `updateGeometryFade` uses counters to know when transitions are finished rather than `setTimeout`

## version 1.11.0 - 2018/02/05

### Features
* Vaccine strains are now displayed if they are specified in `metaJSON.vaccine_choices` ([PR 490](https://github.com/nextstrain/auspice/pull/490))

### Internals
* Tree components and PhyloTree have been reorganized (in `src/components/tree`) and the syntax improved ([PR 493](https://github.com/nextstrain/auspice/pull/493))
* Upgraded to React 16, as well as upgrading redux & react-svg-pan-zoom ([PR 494](https://github.com/nextstrain/auspice/pull/494))

## version 1.10.0 - 2018/02/05

### Features
* Local Branching Index (LBI) coloring can be calculated in auspice (code identical to nextflu) if specified in `color_options` (meta JSON) ([PR 491](https://github.com/nextstrain/auspice/pull/491))

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
