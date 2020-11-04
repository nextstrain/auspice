======================================
Auspice servers
======================================

The Auspice client (i.e. what you see in the web browser) requires a server behind it to
- (a) serve the client HTML, CSS & JavaScript to the browser and
- (b) handle certain `GET <https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol#Request_methods>`_ requests from the client, for instance "give me the zika dataset to display".

We provide a basic server to run Auspice locally -- any time you run `auspice view` or `auspice develop` you're running a server!
In these cases, the server is running on your computer, sending datasets and narratives, which are stored on your machine, to the Auspice client.
Alternatively, you can build your own server -- it just needs to satisfy the above two requirements.


GET Requests
======================================

Currently the client is able to make three requests:

.. csv-table::
   :header: "address", "description"
   :widths: 1, 2

   `/charon/getAvailable`, return a list of available datasets and narratives
   `/charon/getDataset`, return the requested dataset
   `/charon/getNarrative`, return the requested narrative

For instance, when you're running `auspice view` if you go to `localhost:4000/charon/getAvailable <http://localhost:4000/charon/getAvailable>`_ you'll see a list of the available datasets and narratives known to the server.
Similarly, nextstrain.org is a server which has handlers for these three API endpoints, so if you visit `nextstrain.org/charon/getAvailable <https://nextstrain.org/charon/getAvailable>`_ you'll see Nextstrain's available datasets.

See `the server API <../server/api.html>`_ for details about each of these requests.

.. note::
   Note that "/charon" can be changed to any address you wish by customising the client at build time.
   See `the client-cusomisation API <../customise-client/api.html>` for more details.

The "Default" Auspice Server
======================================

The server provided with Auspice is intended to be run on your local setup.
It thus scans the directories you provide when you run it in order to find datasets and narratives to serve.
It has "handlers" for each of the above 3 requests -- i.e. bits of code that tell it how to handle each request.


Customising the Default Auspice Server
======================================

You can customise the default Auspice server by supplying your own handlers for each of the three GET requests.
See `the API documentation <../server/api.html#suppling-custom-handlers-to-the-auspice-server>`_ for how to define these and provide them to `auspice view`.


Writing Your Own Custom Server
======================================

The provided Auspice server also lets you define your own handlers, allowing plenty of flexibility in how requests are handled.
But if you _really_ want to implement your own server, then you only need to implement two things:
- serve the `index.html` file (and linked javascript bundles) which are created by `auspice build` _and_
- handle the three GET requests detailed above

(If you're interested, this is what we do with `nextstrain.org <https://nextstrain.org>`_, where only some of the pages use Auspice. You can see all the code behind that server [here](https://github.com/nextstrain/nextstrain.org).)


Deploying via Heroku
======================================

It should be simple to deploy a custom version of auspice to any server, but we have experience using `Heroku <https://heroku.com/>`_ apps for this.
Deploying to Heroku is straightforward, but there are a few points to note:
1. You must set the config var `HOST` to `0.0.0.0` for the app.
1. You will need to either create a `Procfile` or a `npm run start` script which calls `auspice view` (or `npx auspice view` depending on how you implement auspice)
1. Make sure the datasets to be served are either (a) included in your git repo or (b) downloaded by the heroku build pipeline.
`We use option (b) <https://github.com/nextstrain/auspice/blob/master/package.json>`_ by specifing a npm script called `heroku-postbuild`.


.. toctree::
   :maxdepth: 0
   :titlesonly:
   :caption: Pages available

   api
   authentication
