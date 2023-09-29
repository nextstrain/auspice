import React from "react";


export const TreeInfo = (
  <>
    Change various options relating to how the tree is displayed.
    The exact options available depend on the dataset and specific analysis performed.
    <br/>
    If <em>Branch Length</em> is available, you can choose to display the tree branches in terms of (nucleotide) divergence or (inferred) time.
    It is often helpful to toggle on <em>confidence intervals</em> to gauge the uncertainty in the reconstruction of internal node dates.
  </>
);


export const MapInfo = (
  <>
    Change various options relating to how the map is displayed.
    <br/>
    The <em>geographic resolution</em> chooses the metadata values which define where samples are placed on the map.
    This can be the same as the selected <em>color-by</em> but is often not!
  </>
);

export const AnimationOptionsInfo = (
  <>
    Change various options relating to how the animation proceeds.
  </>
);

export const PanelLayoutInfo = (
  <>
    Control whether to show the tree and the map side-by-side (<em>grid</em>) or expanded (<em>full</em>).
  </>
);

export const FrequencyInfo = (
  <>
    <em>Normalize frequencies</em> controls whether the vertical axis represents the entire dataset or only the samples currently visible (e.g. due to filtering).
    This option is not available when data is limited to prevent numerical issues.
  </>
);

export const MeasurementsInfo = (
  <>
    Change collection of measurements and various display options for the collection.
  </>
);

export const ExplodeTreeInfo = (
  <>This functionality is experimental and should be treated with caution!
    <br/>Exploding a tree by trait X means that for each branch where the trait changes value, we will
    prune off the branch and create a separate (sub)tree.
    It works best when the trait doesn&apos;t change value too frequently.
  </>
);
