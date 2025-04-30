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
    
    This is also where we ladderise the stream, `connectedStreamsLadderised`

2. `processStreams` - For each stream (see step (1)) we compute pivots, partition the stream nodes into categories (via color-by, each category will be rendered as a "ribbon"), and compute the stream dimensions. The stream dimensions involve using a KDE for each terminal node in the stream, evaluating it across the pivots, then summing the results. Note: these dimensions are not in pixel space.


    This step is called on (i) page load, (ii) change in branch-label, (iii) toggle stream tree, (iv) tree visibility updates, (v) tree distance metric change.

    This step can be partially computed if previous information is still valid, for speed reasons.

3. Rendering - The stream information is transformed to pixel space and rendered. This code is all within PhyloTree. Not all of these steps need to be called on each update, and not all are explicitly about streams.

    3a. `setDisplayOrder` - sets `displayOrder` and `displayOrderRange` for the origin node of the stream. The former is the midpoint of the stream, the latter is the range the stream occupies. Nodes _within_ a stream are not assigned displayOrders.

    NOTE: The order streams are processed here is related to the ladderisation of streams!

    3b. `setDistance` - unused for streams, but (I think?) we still set `depth`, `pDepth` on each node within a stream anyways.

    3c. `setLayout` → `streamDisplayOrders` For each stream convert the already set `streamDimensions` (sum of KDE weights) to an array of ripples in display-order space. Set as `displayOrderStream` on the stream start node.

    3d. `mapToScreen` → `mapStreamsToScreen` Computes `streamRipples` which are in pixel-space, based on `displayOrderStream` and `streamPivots`. The structure of `streamRipples` is a 3d matrix, `streamRipples[categoryIdx][pivotIdx]={x, y0, y1}` with an additional property of `streamRipples[categoryIdx].key = <ripple name>`

    3e. `drawStreams` - d3 code to render `streamRipples`, stream labels, and connectors (the branches joining streams to streams)
