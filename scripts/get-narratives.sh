#!/bin/bash

function errorFound {
  echo -e "\nScript Failed at line $1\n"
  exit 2
}
trap 'errorFound $LINENO' ERR

if ! [ -d "narratives" ]; then
  echo "Creating empty \"narratives\" directory"
  mkdir narratives
fi

if [ "$(ls -A narratives)" ]; then
  echo "The \"narratives\" directory is not empty."
  echo "This command will overwrite any local changes to narratives which are also in github.com/nextstrain/narratives"
  read -p "Do you want to continue? (press y to continue, any other key to exit) " -n 1 -r # $REPLY is automatically set since no variable name is supplied
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]
  then
    exit 0
  fi
fi

echo "Downloding narratives from github.com/nextstrain/narratives"
curl -L http://github.com/nextstrain/narratives/archive/master.zip --compressed -o narratives/master.zip
unzip -o -j narratives/master.zip -d narratives
rm narratives/master.zip

echo "Done. Locally available narratives should be accessible from the splash page (normally localhost:4000)"
