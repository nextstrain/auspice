"""
THIS SCRIPT IS TEMPORARY AND SHOULD NOT BE MERGED INTO MASTER
input: augur produced frequency JSON with many thousands of keys including "global_clade:xxxx" and "pivots"
output: JSON dictionary with the following keys:
    * pivots -> array of floats.
    * clade (INT) -> array of floats (clade here is actually a node, each tree node has node.attr.clade which is this INT)
"""

import json
import os, sys

if __name__=="__main__":
    for year in [2, 3, 6, 12]:
        infile = './data/flu_h3n2_ha_{}y_frequencies.json'.format(year)
        try:
            augur = json.load(open(infile))
        except IOError:
            print("Skipping {}y as frequencies.json doesn't exist".format(year))
            continue
        data = {"pivots": augur["pivots"]}
        for key in augur:
            if key.startswith("global_clade:"):
                data[int(key.split(':')[1])] = augur[key]

        with open('./data/flu_h3n2_ha_{}y_pivots.json'.format(year), 'w') as fh:
             json.dump(data, fh, sort_keys = True, indent = 2, ensure_ascii = False)
