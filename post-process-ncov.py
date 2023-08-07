NEW_ANNOTATION = {
  "nuc": {
    "start": 1,
    "end": 29903,
    "strand": "+"
  },
  "ORF1ab": {
    "gene": "ORF1ab",
    "strand": "+",
    "segments":[
      {"start": 266, "end": 13468},
      {"start": 13468, "end": 21555}
    ],
    "display_name": "AKA polyprotein PP1ab. -1 ribisomal frameshift. Cleaved to yield 15 nonstructural proteins (NSP1-10, 12-16)"
  },
  "PP1a": {
    "gene": "ORF1ab",
    "start": 266,
    "end": 13483,
    "display_name": "Polyprotein PP1a. Cleaved to yield 11 nonstructural proteins (NSP1-11)"
  },
  "NSP3": {
    "gene": "ORF1ab",
    "color": "#2c7fb8",
    "start": 266 + (819-1)*3,
    "end": 266 + (2763-1)*3 -1,
    "display_name": "Cleaved from short + long polyproteins",
    "strand": "+",
  },
  "RdRp": {
    "gene": "ORF1ab",
    "color": "#41b6c4",
    # Length is 2796nt (932aa)
    "segments":[
      { # first segment is before the slip
        "start": 266 + (4393-1)*3, # 13442
        "end": 13468,
      },
      {
        "start": 13468,
        "end": 13468 + 2796 -1
      }
    ],
    # "start": 266 + (4393-1)*3,
    # "end": 266 + (5324-1)*3 -1,
    "display_name": "NSP12; Cleaved from long polyprotein only; I'm not sure if the coordinates are correct, BTW!!!",
    "strand": "+",
  },
  "S": {
    "gene": "Spike",
    "end": 25384,
    "display_name": "structural protein; spike protein; surface glycoprotein",
    "start": 21563,
    "strand": "+",
    "features": {
      "RBD": {
        "start": 22517,
        "end": 23182,
        "color": "#feb24c",
        "display_name": "S1 RBD. Coordinates from NCBI genome viewer."
      }
    }
  },
  "E": {
    "end": 26472,
    "dsiplay_name": "ORF4; structural protein; E protein",
    "start": 26245,
    "strand": "+",
    "type": "CDS"
  },
  "M": {
    "end": 27191,
    "start": 26523,
    "strand": "+",
    "gene": "M",
    "display_name": "ORF5; structural protein (membrane glycoprotein)"
  },
  "N": {
    "end": 29533,
    "display_name": "nucleocapsid phosphoprotein (ORF9)",
    "start": 28274,
    "strand": "+",
  },
  "ORF3a": {
    "end": 26220,
    "start": 25393,
    "strand": "+",
  },
  "ORF6": {
    "end": 27387,
    "start": 27202,
    "strand": "+",
  },
  "ORF7a": {
    "end": 27759,
    "start": 27394,
    "strand": "+",
  },
  "ORF7b": {
    "end": 27887,
    "start": 27756,
    "strand": "+",
  },
  "ORF8": {
    "end": 28259,
    "start": 27894,
    "strand": "+",
  },
  "ORF9b": {
    "end": 28577,
    "start": 28284,
    "strand": "+",
  },
}

def a_pos_b(m):
  return (m[0], int(m[1:-1]), m[-1])
  
def recurse(node):

  mutations = node.get('branch_attrs', {}).get('mutations', {})
  if 'ORF1a' in mutations:
    # ORF1a -> ORF1ab is no-change
    mutations['ORF1ab'] = [*mutations['ORF1a']]
    mutations['PP1a'] = [*mutations['ORF1a']]
    del mutations['ORF1a']
  if 'ORF1b' in mutations:
    if 'ORF1ab' not in mutations:
      mutations['ORF1ab'] = [];
    for m in mutations['ORF1b']:
      # ORF1b is in phase with ORF1a
      a, pos, b = a_pos_b(m)
      mutations['ORF1ab'].append(f"{a}{pos+4401}{b}")
    del mutations['ORF1b']

  # Extract mutations which fall in NSP3
  if 'ORF1ab' in mutations:
    mutations['NSP3'] = []
    for m in mutations['ORF1ab']:
      a, pos, b = a_pos_b(m)
      # relative to PP1ab the coords are 819..2763 (in aa space)
      if pos>=819 and pos<=2763:
        mutations['NSP3'].append(f"{a}{pos-819+1}{b}")

  # Extract mutations which fall in RdRp 
  if 'ORF1ab' in mutations:
    mutations['RdRp'] = []
    for m in mutations['ORF1ab']:
      a, pos, b = a_pos_b(m)
      # relative to PP1ab the coords are 4393..5324 (in aa space, so don't need to worry about -1 slippage)
      if pos>=4393 and pos<=5324:
        mutations['RdRp'].append(f"{a}{pos-4393+1}{b}")    

  if "children" in node:
    [recurse(child) for child in node["children"]]



import json
with open("./data/nextclade_sars-cov-2.json", 'r') as fh:
    dataset = json.load(fh)
recurse(dataset['tree'])
dataset['meta']['genome_annotations'] = NEW_ANNOTATION
dataset['meta']['title'] = 'nCoV with adjusted annotations (use with caution!)'
with open("./datasets/entropy2023/ncov_new.json", 'w') as fh:
    json.dump(dataset, fh, indent=0)
