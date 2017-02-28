#!/usr/bin/env bash

# VARIABLES
read -r -d '' purposeMsg <<'EOF'
Bumping Auspice version & deploying to Heroku

This script attemps to do 9 things. It will exit if any steps fail...
(1) checkout master & ensure it is up to date with github
(2) increment Version number (in `src/version.js` and `package.json`) by prompting the user
(3) commit to master
(4) checkout `release` branch from github (will fail if it exists locally)
(5) merge master -> release
(6) tag release with new version
(7) push release branch to github
(8) push release branch to Heroku (automagically builds & runs)
(9) checkout `master` and remove `release` branch

Note that the version in packages.json must be x.y.z, but we use x.y, so z will always be 0

EOF

# FUNCTIONS:

function errorFound {
  echo -e "\nScript Failed at step $step (Line $1)\nYou are responsible for clean up (sorry!)"
  exit 2
}

# TRAPS
trap 'errorFound $LINENO' ERR

# MAIN
echo "$purposeMsg"

# step 1: check master is up to date with github
step="1"
git diff-index --quiet HEAD -- # $? = 1 if uncommited changes
git checkout master
git fetch origin
git status -uno | grep "up-to-date" # $? = 1 if not up-to-date
git diff-index --quiet HEAD -- # $? = 1 if uncommited changes

# step 2: increment version number (req user input)
step="2"
packagesVersion=$(grep "\"version\":" package.json | sed -E "s/.*([0-9]+.[0-9]+.[0-9]+).*/\1/")
srcVersion=$(grep "export const version" src/version.js | sed -E "s/.*([0-9]+.[0-9]+).*/\1/")
if [ ${packagesVersion} != ${srcVersion}.0 ]
  then
    echo "packages.json version (${packagesVersion}) doesn't match version.js version (${srcVersion}.0)"
    exit 2
fi
minorPart=$(echo ${srcVersion} | sed -E 's/^([0-9]+).//')
majorPart=$(echo ${srcVersion} | sed -E 's/.([0-9]+)$//')
let minorPlusOne=$((minorPart+1))
let majorPlusOne=$((majorPart+1))
echo -e "\nCurrent version: ${srcVersion}. Is this a major bump (to ${majorPlusOne}.0) or a minor bump (to ${majorPart}.${minorPlusOne})?"
select yn in "Major" "Minor"; do
    case $yn in
        Major ) newVersion="${majorPlusOne}.0"; break;;
        Minor ) newVersion="${majorPart}.${minorPlusOne}"; break;;
    esac
done
echo -e "\n"
# now replace the version in packages.json and version.js (inplace!)
sed -i '' "s/\"version\": \"${packagesVersion}\"/\"version\": \"${newVersion}.0\"/" package.json
sed -i '' "s/version = ${srcVersion}/version = ${newVersion}/" src/version.js
unset packagesVersion srcVersion minorPart majorPart minorPlusOne majorPlusOne

# step 3: commit to current branch (master)
step="3"
git add .
git commit -m "version bump to ${newVersion}"

# step 4: checkout release branch
step="4"
if ! [ git rev-parse --verify release ]
  then
    echo "release branch already exists locally - fatal"
    exit 2
fi
git checkout -b release origin/release

# step 5: merge master
step="5"
git merge --ff-only master

# # step 6: tag
step="6"
git tag -a v${newVersion} -m "version ${newVersion}"

# step 7: push to github
step="7"
git push origin release

# step 8: push local release branch to heroku master
step="8"
git push -f heroku release:master

# step 9: go back to master & delete release (locally)
step="9"
git checkout master
git branch -d release


echo -e "\nScript completed. New version: $newVersion\n"
