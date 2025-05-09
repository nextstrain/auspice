# Stream Trees (development notes)

## Terminology

* Weight-space
* Display-order-space
* Pixel-space
* Pivots
* Stream - a collection of (tree) nodes to be drawn as a stream graph. 
* Ribbons - an individual stream within a stream graph. The stream graph is partitioned into "categories" (via color-by metadata) and each category is drawn as a ribbon.
* Stream start node

### Summary of main steps

1. `labelStreamMembership` - traverses the tree, clearing any previous stream information and setting stream information on the root nodes of new streams. New streams are identified based on branch labels, so this function is called upon load and stream-branch-label UI. The stream information includes:
    * `node.instream`
    * streams[streamName] = {name, startNode, members, streamChildren, parentStreamName}

2. `processStreams` - For each stream (see step (1)) we compute pivots, partition the stream nodes into categories (via color-by, each category will be rendered as a "ribbon"), and compute the stream dimensions. The stream dimensions involve using a KDE for each terminal node in the stream, evaluating it across the pivots, then summing the results. Note: these dimensions are not in pixel space, but if you visualised them each individual stream would be directly comparable in terms of shape and scale to the eventual rendering in pixel space.

    This is the stage we also calculate the order in which streams should be drawn so that the stream connectors (branches) don't cross other streams. The resultant location of streams can be quite far from their locations in a rectangular tree, and these can also change when we change the tree metric (temporal - divergence). See `calcRenderingOrder` for more details. 

    This step is called on (i) page load, (ii) change in branch-label, (iii) toggle stream tree, (iv) tree visibility updates, (v) tree distance metric change.

    This step can be partially computed if previous information is still valid, for speed reasons.

3. Rendering - The stream information is transformed to pixel space and rendered. This code is all within PhyloTree. Not all of these steps need to be called on each update, and not all are explicitly about streams.

    3a. `setDisplayOrder` - sets `displayOrder` and `displayOrderRange` for the origin node of the stream. The former is the midpoint of the stream, the latter is the range the stream occupies. Also computes `rippleDisplayOrders` (on the stream start node) by converting the already set `streamDimensions` (sum of KDE weights) to an array of ripples in display-order space.
    
    NOTE: The order streams are processed here is related to the ladderisation of streams!

    3b. `setDistance` - unused for streams, but (I think?) we still set `depth`, `pDepth` on each node within a stream anyways.

    3c. `setLayout`

    3d. `mapToScreen` → `mapStreamsToScreen` Computes `streamRipples` which are in pixel-space, based on `rippleDisplayOrders` and `streamPivots`. The structure of `streamRipples` is a 3d matrix, `streamRipples[categoryIdx][pivotIdx]={x, y0, y1}` with an additional property of `streamRipples[categoryIdx].key = <ripple name>`

    3e. `drawStreams` - d3 code to render `streamRipples`, stream labels, and connectors (the branches joining streams to streams)

### KDE calculations

Streams are a Kernel Density Estimate (KDE) with a gaussian kernel to smooth out the contribution of each sampled sequence. Each kernel represents a sample with the kernel centered on the sampling date or divergence value and with a constant standard deviation

We calculate a underlying array of pivots spanning all tips (i.e. covering all streams) and extended slightly either side (so, e.g., the earliest sampled tip is centered at the leftmost pivot). The standard deviation ($\sigma$) of each kernel is a proportion of this pivot span and is thus the same across all kernels and streams. For each stream we use a restricted list of pivots ignoring all pivots $p$ where $p \leq t-3\sigma$, where $t$ is the minimum tip in the stream, and similarly for the maximum; this is entirely for computational efficiency.

These gaussians are summed together to form the KDE  form a Kernel Density Estimate (KDE) $\hat{f}(x) = \sum_{i=1}^{n} w \times \mathcal{N}(\mu,\,\sigma^{2})$ where $\mu$ is the tip sampling date/divergence and $\sigma$ is a constant across all streams. The PDF of the gaussian is evaluated at each of the pivots. 

NOTE: The pivots could be recalculated relative to the domain in view, i.e. when zooming in we calculate more pivots etc, but for the moment this remains constant.

The weighting parameter $w$ scales each gaussian proportional to the number of tips in the stream ($m$). We use a negative exponential $w=\exp(\frac{-(m-4)}{4})+1$. This improves the interpretability of streams as even streams with a single tip are visible on screen, but reduces our ability to directly compare streams against one another.

DEV: You can use `?stream_no_w` to set $w=1$ (i.e. remove it). You can use `?stream_sigma=x` to set a custom sigma value.

When we map the KDE values to display orders (within `setDisplayOrder`) we need to scale the values such that they don't dominate (or be dominated by) the display orders assigned to non-stream tips, where 1 display order unit corresponds to 1 tip. We evaluate gaussian PDF at $x=0$ and scale by this such that the (max) height of a single kernel roughly corresponds to 1 display order unit.