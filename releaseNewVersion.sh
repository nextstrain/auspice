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
echo -e "\n"

# step 1: check master is up to date with github
step="1"
git diff-index --quiet HEAD -- # $? = 1 if uncommited changes
git checkout master
git fetch origin
git status -uno | grep "up-to-date" # $? = 1 if not up-to-date
git diff-index --quiet HEAD -- # $? = 1 if uncommited changes
# some other checks
git remote -v | grep --silent -E "heroku\s+https://git.heroku.com/auspice.git"
heroku apps | grep --silent auspice # should ensure logged in

# step 2: increment version number (req user input)
step="2"
packagesVersion=$(grep "\"version\":" package.json | sed -E "s/.*([0-9]+.[0-9]+.[0-9]+).*/\1/")
srcVersion=$(grep "export const version" src/version.js | sed -E "s/.*([0-9]+.[0-9]+.[0-9]+).*/\1/")
if [ ${packagesVersion} != ${srcVersion} ]
  then
    echo "packages.json version (${packagesVersion}) doesn't match version.js version (${srcVersion}). Fatal."
    exit 2
fi
parts=(${srcVersion//./ }) # magic
bumps=($((${parts[0]}+1)) $((${parts[1]}+1)) $((${parts[2]}+1)))
echo -e "\nCurrent version: ${srcVersion}. Is this a major new release (${bumps[0]}.0.0), a feature release (${parts[0]}.${bumps[1]}.0) or a minor fix (${parts[0]}.${parts[1]}.${bumps[2]})?\n"
select yn in "major-new-release" "feature-release" "minor-fix"; do
    case $yn in
        major-new-release ) msg="major new release"; newVersion="${bumps[0]}.0.0"; break;;
        feature-release ) msg="feature release"; newVersion="${parts[0]}.${bumps[1]}.0"; break;;
        minor-fix ) msg="minor fix"; newVersion="${parts[0]}.${parts[1]}.${bumps[2]}"; break;;
    esac
done
echo -e "\n"
# now replace the version in packages.json and version.js (inplace!)
sed -i '' "s/\"version\": \"${packagesVersion}\"/\"version\": \"${newVersion}\"/" package.json
sed -i '' "s/version = \"${srcVersion}\";/version = \"${newVersion}\";/" src/version.js
unset packagesVersion srcVersion parts bumps yn

# step 3: commit to current branch (master)
step="3"
git add .
git commit -m "version bump to ${newVersion} for release"
git push origin master # push master, with the updated version number...
echo -e "Master successfully updated and pushed to github"

# step 4: checkout release branch
step="4"
if git rev-parse --verify --quiet release
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
git tag -a v${newVersion} -m "${msg}"

# step 7: push to github, including the tag
step="7"
git push --follow-tags origin release

# step 8: push local release branch to heroku master
step="8"
git push -f heroku release:master

# step 9: go back to master & delete release (locally)
step="9"
git checkout master
git branch -d release

echo -e "\nScript completed. $msg (version ${newVersion}) pushed to github:release, github:master and heroku:master\n"
