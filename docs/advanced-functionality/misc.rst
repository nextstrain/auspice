Miscellaneous
=============

How auspice handles unknown or missing data
-------------------------------------------

Attributes assigned to nodes in the tree -- such as ``country`` -- may have values which are *missing* or *unknown*. Auspice will ignore values such as these, and they will not be displayed in the legend or the tree info-boxes (e.g. hovering over the tree). Tips & branches across the tree with values such as these will be gray. (Branches with low confidence for an inferred trait may also show as gray, and hovering over the branches will help identify this.) Note that, if a discrete trait is selected, then a proportion of the pie-chart on the map may also be gray to represent the proportion of tips with missing data.

If a trait is not set on a node it is considered missing, as well as if (after coersion to lower-case) it has one of the following values:

.. code:: js

   ["unknown", "?", "nan", "na", "n/a", "", "unassigned"]

GISAID specific changes to behavior
-----------------------------------

GISAID data provenance annotation
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If the dataset JSON defines a data provenance named ``"GISAID"`` (``JSON → metadata → data_provenance``, see `schema <https://github.com/nextstrain/augur/blob/master/augur/data/schema-export-v2.json>`__), then there are two changes to Auspice behaviour:

1. The GISAID data provenance text (displayed at the top of the page in auspice) will be replaced with the GISAID logo, which is also a link to `gisaid.org <https://gisaid.org>`__.
2. The available metadata for download is different. We now use a “Per-sample acknowledgments table” where each row is a strain in the tree, with the following columns:

   - ``strain``
   - ``gisaid_epi_isl``
   - ``genbank_accession``
   - ``originating_lab``
   - ``submitting_lab``
   - ``author``

Node annotated with ``gisaid_epi_isl``
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

When hovering or clicking on tips (in the tree), nodes annotated with ``gisaid_epi_isl`` will behave slightly differently. These info-boxes will display “GISAID EPI ISL” and, in the tip-clicked info-panel, the value will also be a link to `gisaid.org <https://gisaid.org>`__.
