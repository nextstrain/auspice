---
title: Community Builds
---

> Needs to be expanded and updated with whatever we actually end up implementing!


Our desire is to develop a community of scientists using auspice, and easily sharing datasets is a crucial element of this! 
To achieve this, we currently provide a way to access datasets committed to public GitHub repositories.

## How to use

#### What you'll need:
1. A public github repository -- e.g. `github.com/orgname/reponame`
2. A auspice (v2) JSON file -- [see here for details](introduction/data-formats.md)

#### Steps:
1. Create a folder called `auspice` in the repo
2. Add the (default) JSON file to this directory, with the same name as the repo.
3. (optional) you can add additional JSONs, they must start with the repo name and then contain additional fields seprated by a **_** character. E.g. `reponame_a_b.json`.
4. Commit the files to the master branch and push to GitHub.
5. That's it 💪

#### How to access:
1. "https://auspice.us/orgname/reponame" will access the default dataset
2. Additional JSONs can be found at "https://auspice.us/orgname/reponame/a/b"


> If you'd like a link to your dataset to be on the auspice.us front page then [give us an email 🤩](mailto:hello@nextstrain.org)


## Real World Example: Zika virus in the US Virgin Islands
[Alli Black's](https://bedford.io/team/allison-black/) analysis of Zika virus in the US Virgin Islands is being updated [in this github repo](https://github.com/blab/zika-usvi/) and you can see the most up-to-date results at [auspice.us/github/blab/zika-usvi](https://auspice.us/github/blab/zika-usvi)



## Incomplete list of community builds
* 😳
