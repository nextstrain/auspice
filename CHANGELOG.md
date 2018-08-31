* The visibility of nodes on the tree now more accurately reflects the selected date range - [PR 644](https://github.com/nextstrain/auspice/pull/644)
* Info text is easier to read & the date range reflects the genomes in view - [PR 639](https://github.com/nextstrain/auspice/pull/639)

### Narrative improvements
* Toggle between narrative & interactive mode is much clearer - [PR 648](https://github.com/nextstrain/auspice/pull/648)
* URL queries with no clade set zoom to the entire tree - [PR 644](https://github.com/nextstrain/auspice/pull/644)

## version 1.28.0 - 2018/08/25
* Narratives -- see [nextstrain.org/docs/visualisation/narratives](https://nextstrain.org/docs/visualisation/narratives) for documentation.
* Time slicing & non-highlighted branches are now displayed in a cleaner fashion - [PR 638](https://github.com/nextstrain/auspice/pull/638)
* Selected clades (i.e. the tree has been zoomed) are now part of URL state - [PR 633](https://github.com/nextstrain/auspice/pull/633)

## version 1.27.1 - 2018/08/24
* Fixed broken navigation links
* Entropy zooming bug fixed - [PR 637](https://github.com/nextstrain/auspice/pull/637)

## version 1.27.0 - 2018/08/20
* Saved SVGs now include two trees (if displayed) - [PR 630](https://github.com/nextstrain/auspice/pull/630)

## version 1.26.0 - 2018/08/20
* Entropy panel zoom changes are now reflected in URL state - [PR 626](https://github.com/nextstrain/auspice/pull/626)

## version 1.25.2 - 2018/08/17

* Negative dates (BCE) are now handled correctly - [PR 627](https://github.com/nextstrain/auspice/pull/627)
* Small entropy zooming fixes - [PR 624](https://github.com/nextstrain/auspice/pull/624)
* Bugfix to prevent the grid being drawn over the branches / tips in some situations - [PR 629](https://github.com/nextstrain/auspice/pull/629)
* Transmissions which involve demes without lat/longs now show an error notification - [PR 608](https://github.com/nextstrain/auspice/pull/608)

## version 1.25.1 - 2018/08/10
* Small fixes to entropy zooming behaviour
* Gaps are not counted in the entropy calculations & are not displayed in the info panel pop up

## version 1.25.0 - 2018/08/09
* New Entropy panel zooming functionality - [PR 609](https://github.com/nextstrain/auspice/pull/609)

## version 1.24.1 - 2018/08/08
* Upgrade dependencies
* Bugfix when changing between staging datasets - [issue 618](https://github.com/nextstrain/auspice/issues/618)

## version 1.24.0 - 2018/08/05
* Tree grid improvements - [PR 610](https://github.com/nextstrain/auspice/pull/610)
  * Allow negative (i.e. BCE) dates
  * Display y-dates and horizontal lines in the clock layout view
  * Improved spacing between grid points
* SVG elements in the DOM are now in named groups which improves debugging and prevents incorrect-layering bugs. [PR 612](https://github.com/nextstrain/auspice/pull/612)
* Fixed a bug where the available datasets (dropdowns in sidebar) contained invalid values [PR 614](https://github.com/nextstrain/auspice/pull/614)
* Community sourced datasets (nextstrain.org/community/...) display a link to the github repo in the sidebar [PR 615](https://github.com/nextstrain/auspice/pull/615)
* Since v1.22.3 changing datasets preserved the URL queries (e.g. `?l=radial`).
A number of bugs relating to this have been fixed, where these queries were no longer valid for the new dataset.
This also fixed potential issues related to loading datasets where the URL queries were invalid.
[PR 613](https://github.com/nextstrain/auspice/pull/613)


## version 1.23.2 - 2018/07/30
* Increase the padding when displaying two panels side by side to avoid bugs on different browsers / OSs. [issue 574](https://github.com/nextstrain/auspice/issues/574)

## version 1.23.1 - 2018/07/30
* Improved the alignment of branch labels for the second tree

## version 1.23.0 - 2018/07/28

* The server no longer needs to be transpiled
* The interaction between data sources (local / staging / live) has been changed.
  * The first part of the URL now defines the source, e.g. /flu is live, /local/flu is local, /staging/flu...
  * Accordingly, `npm run server.js localData` no longer has the effect it used to!
  * Github committed JSONs are now accessible via /community/orgName/repoName (slightly experimental and subject to change)
* JSONs are now delivered to the client using compression (when available)
* Frequency JSONs are only fetched when the frequency panel is specified (in the meta JSON)
* The server combines the tree & meta JSONs into a single "unified" JSON, in preparation for a move to v2.0 JSONs.
* Manifest files / parsing have been moved from the server
* Various improvements to the narratives (still experimental and the API is subject to change)
* Second trees are specified by `/na:ha/` rather than `/na/...?tt=ha`. The old syntax is still supported for backwards compatibility.


## version 1.22.3 - 2018/07/19
* Trigger Docker Hub automated build to rebuild via Travis CI when master branch is pushed and tests are successful
* Simplify counting of traits across tree
* Improve README
* Remove Electron
* Restored the ability to run the non-dev server with local data [PR 589](https://github.com/nextstrain/auspice/pull/589)

## version 1.22.2 - 2018/07/10
* Bugfix in tip attribute counting algorithm

## version 1.22.1 - 2018/07/09
* Legend items no longer include duplicates, and include month for dates within the past 10 years - thanks @emmahodcroft[PR 592](https://github.com/nextstrain/auspice/pull/592)
* Bugfix related to colorBy values only specified on internal nodes [issue 593](https://github.com/nextstrain/auspice/issues/593)

## version 1.22.0 - 2018/07/03
* Auspice can now run with an incomplete metadata file, or even without a metadata file at all! [PR 586](https://github.com/nextstrain/auspice/pull/586)
* Download modal reinstated [PR 587](https://github.com/nextstrain/auspice/pull/587)
  * Improved styling
  * All panes now saved to a single SVG
  * Map panning SVG-save bugs (mostly) fixed
  * TSV used instead of CSV
* Fix WNV colorBy link in footer -- [issue 590](https://github.com/nextstrain/auspice/issues/590)

## version 1.21.3 - 2018/06/27
* Show tree titles (e.g. `NA`) when two trees are displayed
* Multi-part datasets (e.g. `flu/seasonal/h3n2...`) which are not in the manifest file can now be loaded; various bugs fixed for running locally without a manifest file.
* Other minor bugfixes & package upgrades

## version 1.21.2 - 2018/06/07
* Disable Untangling

## version 1.21.1 - 2018/06/04
* Narratives are now sourced from [the static github repo](https://github.com/nextstrain/static/tree/master/narratives)

## version 1.21.0 - 2018/06/01
* Untangling via a simple algorithm upon 2nd tree load
* Segment names displayed above trees (if 2 trees)
* Fix hover-info-box date bug -- [issue 572](https://github.com/nextstrain/auspice/pull/572)

## version 1.20.3 - 2018/05/30
* Narratives now accessed via `/narratives/...` URLs
* App now works without needing a manifest file (but the datasets dropdown needs it)
* Initial load simplified
* Sidebar doesn't appear until the data is ready to be displayed


## version 1.20.2 - 2018/05/21
* Changes to the frequencies threshold

## version 1.20.1 - 2018/05/21
* Changes to the frequencies threshold
* Narratives restored

## version 1.20.0 - 2018/05/15
**Auspice is now served via the nextstrain.org server together with the static (gatsbyjs) site**
* Changes to the server code organisation
* Static content removed
* New splash page listing the (should only be accessed from local instances or 404s, live site splash is via the static site)
* Improved page navigation API
* Travis CI 🎉
* Auspice version is displayed in the footer
* Release script modified (Travis CI listens to `release` and pushes a successful build to S3 which is fetched by the live server)


## version 1.19.1 - 2018/05/09
* Fixed a bug where proteins starting with a number (e.g. 2K) were assumed to be nucleotide genotypes.

## version 1.19.0 - 2018/05/09
* Improved sidebar styling on both mobile & desktop
* Reset layout button doesn't re-instantiate the PhyloTree object, rather it resets the branch thicknesses & sets the whole tree to be in view
* Padding improvements - tip labels are now visible, and small clades render better.
* Tip names now shown for up to 100 taxa
* Branch thickness restored -- [issue 544](https://github.com/nextstrain/auspice/pull/544)
* Tree panning has been removed (we no longer use `react-svg-pan-zoom`)

## version 1.18.10 - 2018/05/07

* Separate Nucleotide mutations from gaps / Ns in info-box - thanks @emmahodcroft [PR 552](https://github.com/nextstrain/auspice/pull/552)
* Frequencies y-axis is no longer rounded to the nearest 0.05

## version 1.18.9 - 2018/05/03
* update flu footer
* start using travis CI

## version 1.18.8 - 2018/05/02
* temporary fix for map transmissionIndices errors (bug still exists, [issue 547](https://github.com/nextstrain/auspice/issues/547))

## version 1.18.7 - 2018/05/02
* Fix frequencies panel x-axis bug
* Linting
* Minor style changes

## version 1.18.6 - 2018/04/30
* update WNV footer

## version 1.18.5 - 2018/04/27
* update WNV footer

## version 1.18.4 - 2018/04/26
* Use exponential notation for the clock rate

## version 1.18.3 - 2018/04/23
* Updated the footer for LASV & WNV

## version 1.18.2 - 2018/04/16
* LBI color scale domain is [0, 0.7] [Issue 541](https://github.com/nextstrain/auspice/issues/541)
* Fix bug with antigenic advance & frequencies [Issue 540](https://github.com/nextstrain/auspice/issues/540)
* Hovering over a tree legend value of zero now correctly highlights matching tips
* Undefined color traits are now grey on a discrete scale
* Removed all references to `node.attr.strain` (tree JSON) and `seq_author_map` (meta JSON)

## version 1.18.1 - 2018/04/15
* Make date slider spacing consistent between animation and drag

## version 1.18.0 - 2018/04/14
* Tanglegrams enabled! (bugfixes & reinstate controls dropdown)
* Status pages: nextstrain.org/status & nextstrain.org/status/staging
* Narrative files are sourced from nextstrain.org repository

## version 1.17.4 - 2018/04/10
* Updated LASV footer

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
