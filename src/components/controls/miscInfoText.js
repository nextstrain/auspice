import React from "react";


export const TreeOptionsInfo = (
  <>
    Change various options relating to how the tree is displayed.
    The exact options available depend on the dataset and specific analysis performed.
    <br/>
    If <em>Branch Length</em> is available, you can choose to display the tree branches in terms of (nucleotide) divergence or (inferred) time.
    It is often helpful to toggle on <em>confidence intervals</em> to gauge the uncertainty in the reconstruction of internal node dates.
  </>
);


export const MapOptionsInfo = (
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

export const PanelOptionsInfo = (
  <>
    Control which panels are being displayed and whether to show the tree and the map side-by-side (<em>grid</em>) or expanded (<em>full</em>).
    <br/>
    Note that what options are available here are dataset specific!
  </>
);

export const FrequencyInfo = (
  <>
    <em>Normalize frequencies</em> controls whether the vertical axis represents the entire dataset or only the samples currently visible (e.g. due to filtering).
    This option is not available when data is limited to prevent numerical issues.
  </>
);
