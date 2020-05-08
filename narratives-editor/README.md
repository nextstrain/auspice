# auspice-ex-avibus: live editing of auspice narratives (situation reports)

## Status
Early development version. Expect bugs.

## How to use

Currently you must run locally (website will be added here once it exists).

Begin by clicking the button to "load example narrative...", or drag & drop a narrative file (markdown) onto the broswer.
You will then be presented with the raw contents of the narrative slides on the left hand side of the screen, and the corresponding auspice visualisation of the currently selected slide on the right hand side.
You can edit the raw (markdown) content of each block in the editor (left hand side).
Click update and you'll see the rendering of this slide update!
When you're done you can click the button to download the (edited) narrative as a markdown file.

## How to run locally

```bash
# follow the instructions to get auspice working locally, from source
cd narratives-editor # the directory where this README is
npm install # there's some dependencies specific to auspice-ex-avibus
npm run start
```

## To-do list

_in no particular order_

- [ ] Improve the display of the actual narratives. Currently we're importing the code which runs the Mobile display. We can't just use the non-mobile display components because they rely on absolute positioning and take up the entire screen. The mobile view also suffers from these problems, but is at least semi-functional. This will probably require some (slight) refactoring of the auspice client code. The mobile view is problematic as it can't (by design) display both a narrative sidebar and a mainDisplayMarkdown section.
- [ ] Related to above, the map barely works at all
- [ ] ... and the tree is scaled to the entire browser window size (this is my guess of what's happening)
- [ ] Deploy via a heroku app, and eventually x.auspice.org
- [x] Allow markdown drag and drop to begin with
- [ ] Replace the "load example" button with a dropdown selector of all listed narratives (via /charon/getAvaiable API call)
- [ ] Trigger rerendering of mobile view when a different dataset is loaded
- [ ] Get markdown syntax highlighting working (and yaml)
- [ ] Allow adding of narrative pages, removal etc etc
- [ ] Currently we conveniently skip over mainDisplayMarkdown components. Must change.
- [ ] [long-term] Wire it up so that narratives can be uploaded (to GitHub?) rather than saved locally
- [ ] Move away from just displaying our markdown (which is acutally a markdown-like DSL) and make it more like a form -- e.g. for slide `n` you would have Dataset: ..., Query: ..., , Title: ..., Sidebar markdown content (md): ..., Main display Markdown content (with radio toggle). There are mocks of these in the original issue.
- [ ] Implementing the markdown parsing server side was easy prompting 2 thoughts. Firstly, shift this into auspice and make a `/charon/getNarrative?type=md` or similar API call. Secondly, the actual parsing algorithm is terrible and was written quickly many years ago. It urgently needs tidying up.
- [ ] The `run.js` is a copy & paste of the code behind `auspice develop`. The cli source code should be slightly refactored so that we can have a very simple auspice-ex-avibus server which imports the majority of code from the main auspice server. We can then have another command-line tool installed, something like `auspice-ex-avibus {build,view,develop}`
- [ ] The timing functions aren't being stripped (because of the babelrc)
- [ ] Reallow extensions
- [ ] URL parsing has been removed for this prototype, but should become part of a future version
- [ ] Logo
- [ ] Actually design the page, rather than just focusing on functionality
- [ ] Sort out the eslint errors where dependencies are from the parent package.json. I don't want to duplicate dependencies as I want to ensure the same React code is being used everywhere.
- [ ] A lot of the auspice CSS isn't being imported, so the narratives don't actually render that well
- [ ] Changing dataset in frontmatter doesn't change the underlying dataset. Perhaps query also.
- [ ] The 
- [ ] We now have tests in auspice. Would be nice to make them part of this prototype from an early stage.
- [ ] Error handling & sanitisizaion (bearing in mind we're allowing users to change the text content...)