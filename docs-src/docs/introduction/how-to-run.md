---
title: Run Auspice
---


Auspice is run as a command line program -- `auspice` -- with currently three subcommands.
You can run each command with `--help` attached to see help from the command line.

* `auspice view --help` 
* `auspice build --help`
* `auspice develop --help`


## Get an example dataset up & running

In order to get up & running you'll need to have some datasets to visualise.
Please see the [nextstrain docs](https://nextstrain.org/docs/) for tutorials on how to do this.
For the purposes of getting auspice up & running you can download the current zika dataset via:

```
mkdir datasets
curl http://data.nextstrain.org/zika_meta.json --compressed -o datasets/zika_meta.json
curl http://data.nextstrain.org/zika_tree.json --compressed -o datasets/zika_tree.json
```

And then run `auspice` via:
```
auspice view --datasetDir datasets
```

This will allow you to run auspice locally (i.e. from your computer) and view the dataset which is behind [nextstrain.org/zika](https://nextstrain.org/zika).
(See below for how to get all of the data behind nextstrain.org.)

## `auspice view`

Launch a local server to view locally available datasets & narratives. The 
handlers for (auspice) client requests can be overridden here (see 
documentation for more details). If you want to serve a customised auspice 
client then you must have run "auspice build" in the same directory as you 
run "auspice view" from.

This is the main command we'll run auspice with, as it makes auspice available in a web browser for you.
There are two common arguments used:

| argument name | data supplied | description |
| --------      | ----------     | --------    |
|datasetDir    | PATH   |    Directory where datasets (JSONs) are sourced. This is  ignored if you define custom handlers. |
|narrativeDir    | PATH   |  Directory where narratives (Markdown files) are  sourced. This is ignored if you define custom handlers. |

For more complicated setups, where you define your own server handlers, see [Suppling custom handlers to the auspice server](server/api.md#suppling-custom-handlers-to-the-auspice-server).

## `auspice build`

Build the client source code bundle. 
This is needed in three cases:
1. You have installed auspice from source, or updated the source code.
1. You are editing the source code and need to rebuild the client
1. You wish to build a customised version of the auspice client.
See [Customising auspice](customise-client/introduction.md) for more info.


## `auspice develop`

Launch auspice in development mode. This runs a local server and uses 
hot-reloading to allow automatic updating as you edit the code.

This is only useful if you are editing the client source code!

## `auspice convert`

This is a utility command to convert between dataset formats.
Currently, it only converts "auspice v1" JSONs into "auspice v2" JSONs, using the same code that is [programatically importable](server/api.md#convertfromv1).

Right now, `auspice view` will automatically convert "v1" JSONs into "v2" JSONs, so there's no need to do this yourself.


## Input file formats

> Auspice is agnostic about the data it visualises -- they don't have to be viral genomes, or real-time, or generated in Augur.
(They do, however have to be in a specific file format.)

Auspice takes two different file types -- datasets (the tree, map etc) are defined as one or more JSON files, while narratives are specified as a markdown file.

### dataset JSONs

For datasets, auspice (v2.x) can currently load either
* "auspice v1" JSONs (meta + tree JSONs) -- see the JSON shcemas [here](https://github.com/nextstrain/augur/blob/v6/augur/data/schema-export-v1-meta.json) and [here](https://github.com/nextstrain/augur/blob/v6/augur/data/schema-export-v1-tree.json).
The zika dataset we download above is in this format.
* "auspice v2" JSONs. See the JSON schema [here](https://github.com/nextstrain/augur/blob/v6/augur/data/schema-export-v2.json).

See the [Server API](server/api.md) for more details about the file formats an auspice server (e.g. `auspice view`) sends to the client.

Currently we mainly use [augur](https://github.com/nextstrain/augur) to create these datasets.
See [the nextstrain documentation](https://nextstrain.org/docs/bioinformatics/introduction-to-augur) for more details.

> We are working on ways to make datasets in newick / nexus formats available. You can see an early prototype of this at [auspice-us.herokuapp.com](https://auspice-us.herokuapp.com/) where you can drop on newick (and CSV) files.
Using BEAST trees is possible, but you have to use augur to convert them first.


### narratives
For narratives, please see [writing a narrative](narratives/how-to-write.md) for a description of the file format.


## Obtaining a set of input files

If you'd like to download the datasets & narratives which we use on nextstrain.org then there are two scripts which allow you to do this.

* You can download the dataset JSONs by running [this script](https://github.com/nextstrain/auspice/blob/master/scripts/get-data.sh) which will create a `./data` directory for you.
* You can download the narrative markdown files by running [this script](https://github.com/nextstrain/auspice/blob/master/scripts/get-narratives.sh) which will create a `./narratives` directory for you.

You can then run `auspice view --datasetDir data --narrativeDir narratives` to visualise all of the nextstrain.org datasets locally.