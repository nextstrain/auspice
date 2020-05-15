---
title: How to Run Auspice
---


Auspice is run as a command line program -- `auspice` -- with various subcommands.
You can run each command with `--help` attached to see help from the command line.

* `auspice view --help` (this is the main command for interacting with Auspice)
* `auspice build --help`
* `auspice develop --help`
* `auspice convert --help`


## How to Get an Example Dataset Up and Running

In order to get up and running you'll need to have some datasets to visualise.
For the purposes of getting Auspice up and running you can download the current Zika dataset via:

```bash
mkdir datasets
curl http://data.nextstrain.org/zika.json --compressed -o datasets/zika.json
```

And then run `auspice` via:
```bash
auspice view --datasetDir datasets
```

This will allow you to run Auspice locally (i.e. from your computer) and view the dataset which is behind [nextstrain.org/zika](https://nextstrain.org/zika).
[See below](#obtaining-a-set-of-input-files) for how to download all of the data available on [nextstrain.org](https://nextstrain.org).


To analyse your own data, please see the tutorials on the [nextstrain docs](https://nextstrain.org/docs/).

## `auspice view`

This is the main command we'll run Auspice with, as it makes Auspice available in a web browser for you.
There are two common arguments used:

| argument name | data supplied | description |
| --------      | ----------     | --------    |
|datasetDir    | PATH   |    Directory where datasets (JSONs) are sourced. This is  ignored if you define custom handlers. |
|narrativeDir    | PATH   |  Directory where narratives (Markdown files) are  sourced. This is ignored if you define custom handlers. |

For more complicated setups, where you define your own server handlers, see [suppling custom handlers to the Auspice server](server/api.md#suppling-custom-handlers-to-the-auspice-server).

## `auspice build`

Build the client source code bundle.
This is needed in three cases:
1. You have installed Auspice from source, or updated the source code.
1. You are editing the source code and need to rebuild the client
1. You wish to build a customised version of the Auspice client.
See [Customising Auspice](customise-client/introduction.md) for more info.


## `auspice develop`

Launch Auspice in development mode. This runs a local server and uses
hot-reloading to allow automatic updating as you edit the code.

This is only useful if you are editing the client source code!

## `auspice convert`

This is a utility command to convert between dataset formats.
Currently, it only converts "Auspice v1" JSONs into "Auspice v2" JSONs, using the same code that is [programatically importable](server/api.md#convertfromv1).

Right now, `auspice view` will automatically convert "v1" JSONs into "v2" JSONs, so there's no need to do this yourself.


## Input File Formats

> Auspice is agnostic about the data it visualises -- they don't have to be viral genomes, or real-time, or generated in Augur.
(They do, however have to be in a specific file format.)

Auspice takes two different file types: datasets (the tree, map, etc.), which are defined as one or more JSON files and narratives, which are specified as a Markdown file.

### Dataset JSONs

For datasets, Auspice (v2.x) can currently load one of two formats:
* [Auspice v1 JSONs](#auspice-v1-jsons) - _The zika dataset we download above is in this format._
* [Auspice v2 JSONs](#auspice-v2-jsons)

Currently we mainly use [Augur](https://github.com/nextstrain/augur) to create these datasets.
See [the Nextstrain documentation](https://nextstrain.org/docs/bioinformatics/introduction-to-augur) for more details.

See the [Server API](server/api.md) for more details about the file formats an Auspice server (e.g. `auspice view`) sends to the client.

See [the v2 release notes](releases/v2.md) for details and motivation for the v2 format.

> We are working on ways to make datasets in Newick / Nexus formats available. You can see an early prototype of this at [auspice-us.herokuapp.com](https://auspice-us.herokuapp.com/) where you can drop on Newick (and CSV) files.
Using BEAST trees is possible, but you have to use Augur to convert them first.

#### Auspice v1 JSONs

This format includes:
* Tree JSON (required) - [schema here](https://github.com/nextstrain/augur/blob/master/augur/data/schema-export-v1-tree.json)
  * The tree structure is encoded as a deeply nested JSON object, with traits (such as country, divergence, collection date, attributions, etc.) stored on each node. 
  * The presence of a `children` property indicates that it's an internal node and contains the child objects. 
  * The filename _must_ end with `_tree.json`.
* Metadata JSON (required) - [schema here](https://github.com/nextstrain/augur/blob/master/augur/data/schema-export-v1-meta.json)
  * Additional data to control and inform the visualization is stored via the `metadata` property (key) at the top level of the JSON. 
  * The filename _must_ end with `_meta.json` and have the same prefix as the tree JSON above. 
* Frequency JSON (optional) - [example here](http://data.nextstrain.org/flu_seasonal_h3n2_ha_2y_tip-frequencies.json)
  * Generates the frequencies panel, e.g. on [nextstrain.org/flu](https://nextstrain.org/flu). 

#### Auspice v2 JSONs

This format includes:
* Auspice v2 JSON (required) - [schema here](https://github.com/nextstrain/augur/blob/master/augur/data/schema-export-v2.json)
  * The single input format required for Auspice v2, including the same tree and meta info as v1 in one file.
* Frequency JSON (optional) - [example here](http://data.nextstrain.org/flu_seasonal_h3n2_ha_2y_tip-frequencies.json)
  * Generates the frequencies panel, e.g. on [nextstrain.org/flu](https://nextstrain.org/flu). 

### Narratives
For narratives, please see [Writing a Narrative](narratives/how-to-write.md) for a description of the file format.


## Obtaining a Set of Input Files

If you'd like to download the datasets and narratives on [nextstrain.org](https://nextstrain.org) then there are two scripts which allow you to do this:

* You can download the dataset JSONs by running [this script](https://github.com/nextstrain/auspice/blob/master/scripts/get-data.sh) which will create a `./data` directory for you.
* You can download the narrative Markdown files by running [this script](https://github.com/nextstrain/auspice/blob/master/scripts/get-narratives.sh) which will create a `./narratives` directory for you.

You can then run `auspice view --datasetDir data --narrativeDir narratives` to visualise all of the [nextstrain.org](https://nextstrain.org) datasets locally.
