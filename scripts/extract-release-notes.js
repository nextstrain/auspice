/* Simple script to extract latest release notes from CHANGELOG.md
 * Based on @ivan-aksamentov's https://github.com/nextstrain/nextclade/blob/613637e1305cf742e13dbe073976257365ca14dd/scripts/extract-release-notes.py
 * It is intended to be run as part of releaseNewVersion.sh
 */

const fs = require('fs');

function main() {
  const releaseNotes = [];
  const content = fs.readFileSync('./CHANGELOG.md', {encoding: 'utf8'}).split("\n");
  let insideReleaseBlock = false;
  for (let i=0; i<content.length; i++) {
    if (!insideReleaseBlock && content[i].startsWith("## version")) {
      insideReleaseBlock = true;
      continue;
    }
    if (insideReleaseBlock) {
      if (content[i].startsWith("## version")) {
        break; // next release found
      }
      if (!releaseNotes.length && content[i]==="") {
        continue; // skip leading empty lines
      }
      releaseNotes.push(content[i]);
    }
  }
  console.log(releaseNotes.join("\n"));
}

main();
