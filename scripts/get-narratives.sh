#!/bin/bash

function errorFound {
  echo -e "\nScript Failed at step $step (Line $1)\n"
  exit 2
}
trap 'errorFound $LINENO' ERR

if ! [ -d "local_narratives" ]; then
  echo "Creating empty local_narratives directory"
  mkdir local_narratives
fi

if [ "$(ls -A local_narratives)" ]; then
  echo "The local_narratives directory is not empty."
  echo "This command will overwrite any local changes to narratives which are also in github.com/nextstrain/narratives"
  read -p "Do you want to continue? (press y to continue, any other key to exit) " -n 1 -r # $REPLY is automatically set since no variable name is supplied
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]
  then
    exit 0
  fi
fi

echo "Downloding narratives from github.com/nextstrain/narratives"
curl -L http://github.com/nextstrain/narratives/archive/master.zip --compressed -o local_narratives/master.zip
unzip -o -j local_narratives/master.zip -d local_narratives
rm local_narratives/master.zip

echo "Done. Remember, local narratives are accessed via localhost:4000/local/narratives/x, where x is the markdown filename (without .md and with underscores converted to forward slashes)"
