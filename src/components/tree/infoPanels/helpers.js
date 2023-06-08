import { getTraitFromNode } from "../../../util/treeMiscHelpers";
import { numericToCalendar } from "../../../util/dateHelpers";


/**
 * Attempt to display the best name we can for a node, depending on how we are looking at a node.
 * The returned string will be rendered on a line of its own, so an empty string will look ok
 * Future enhancement: we could examine the coloring metadata (if available) and format the value accordingly
 */
export function nodeDisplayName(t, node, tipLabelKey, branch) {
  let tipLabel = getTraitFromNode(node, tipLabelKey)
  if (tipLabelKey==='num_date' && tipLabel) tipLabel = numericToCalendar(tipLabel)
  const terminal = !node.hasChildren;

  if (branch) {
    if (terminal) {
      return tipLabel ? t("Branch leading to {{tipLabel}}", {tipLabel}) : t("Terminal branch") // hover + click
    }
    return t("Internal branch")  // branch click only
  }
  /* TIP */
  return tipLabel;
}
