#!/usr/bin/env bash

# VARIABLES
read -r -d '' purposeMsg <<'EOF'
Bumping Auspice version & deploying to Heroku

This script attempts to do 9 things. It will exit if any steps fail...
(1) checkout master & ensure it is up to date with github
(2) increment Version number (in `src/version.js` and `package.json`) by prompting the user
(3) add a title with the version number to the CHANGELOG
(4) commit to master
(5) checkout `release` branch from github (will fail if it exists locally)
(6) merge master -> release
(7) tag release with new version
(8) push release branch to github (this triggers Travis CI to build, upload and trigger Heroku deploy)
(9) checkout `master` and remove local `release` branch

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

# exit if release branch exists locally
if git rev-parse --verify --quiet release
  then
    echo "release branch already exists locally - fatal"
    exit 2
fi

# step 1: check master is up to date with github
step="1"
git diff-index --quiet HEAD -- # $? = 1 if uncommited changes
git checkout master
git fetch origin
git status -uno | grep "up-to-date\|up to date" # $? = 1 if not up-to-date OR up to date
git diff-index --quiet HEAD -- # $? = 1 if uncommited changes

# step 2: increment version number (req user input)
step="2"
packagesVersion=$(grep "\"version\":" package.json | perl -pe 's/.*([0-9]+.[0-9]+.[0-9]+).*/\1/')
srcVersion=$(grep "const version" src/version.js | perl -pe 's/.*([0-9]+.[0-9]+.[0-9]+).*/\1/')
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
perl -pi -e "s/\"version\": \"${packagesVersion}\"/\"version\": \"${newVersion}\"/" package.json
perl -pi -e "s/version = \"${srcVersion}\";/version = \"${newVersion}\";/" src/version.js
unset packagesVersion srcVersion parts bumps yn

# step 3: add h2 title to CHANGELOG.md with newVersion & date, while preserving YAML frontmatter for docs
today=$(date +'%Y/%m/%d')
echo -e "---\ntitle: Changelog\n---\n\n## version ${newVersion} - ${today}\n\n$(tail -n +4 CHANGELOG.md)" > CHANGELOG.md
unset today

# step 4: commit to current branch (master) & push to github (origin)
step="4"
git add .
git commit -m "version bump to ${newVersion} for release"
git push origin master # push master, with the updated version number...
echo -e "Master successfully updated and pushed to github"

# step 5: checkout release branch from github
step="5"
git checkout -b release origin/release

# step 6: merge master into release
step="6"
git merge --ff-only master

# # step 7: tag
step="7"
git tag -a v${newVersion} -m "${msg}"

# step 8: push to github, including the tag
step="8"
git push --follow-tags origin release

# step 10: go back to master & delete release branch (locally)
step="9"
git checkout master
git branch -d release

echo -e "\nScript completed. $msg (version ${newVersion}) pushed to github:release and github:master\n"
