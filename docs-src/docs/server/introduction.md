---
title: Auspice servers
---

The Auspice client (i.e. what you see in the web browser) requires a server behind it to
- (a) serve the client to the browser and
- (b) handle certain [GET requests](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol#Request_methods) from the client, for instance "give me the zika dataset to display".

We provide a basic server to run auspice locally -- any time you run `auspice view` or `auspice develop` you're running a server!
Alternatively, you can build your own server -- all that is required is to satisfy the above two requirements.


## GET requests

Currently the client makes three requests:

| address | description |
| --- | --- |
| `/charon/getAvailable` | return a list of available datasets and narratives |
| `/charon/getDataset` | return the requested dataset |
| `/charon/getNarrative` | return the requested narrative |

For instance, when you're running `auspice view` if you access [localhost:4000/charon/getAvailable](http://localhost:4000/charon/getAvailable) you'll see a list of the avialable datasets & narratives known to the server.

See [the server API](server/api.md) for details about each of these requests.


## The "default" auspice server

The server provided with auspice is intended to be run on your local setup.
It thus scans the directories you provide when you run it in order to find datasets & narratives to serve.
It has "handlers" for each of the above 3 requests -- i.e. bits of code that tell it how to handle each request.


## Customising the default auspice server

You can customise the default auspice server by supplying your own handlers for each of the three GET requests.
See [the API documentation](server/api#suppling-custom-handlers-to-the-auspice-server) for how to define these and provide them to `auspice view`.



## Writing your own custom server

The provided auspice server also lets you define your own handlers, allowing plenty of flexibility in how requests are handled.
But if you _really_ want to implement your own server, then you only need to implement two things:
- serve the `index.html` file (and linked javascript bundles) which are created by `auspice build` _and_
- handle the three GET requests detailed above

(If you're interested, this is what we do with [nextstrain.org](https://nextstrain.org), where only some of the pages use auspice. You can see all the code behind that server [here](https://github.com/nextstrain/nextstrain.org).)





