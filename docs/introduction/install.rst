===============
Install Auspice
===============

Prerequisites
=============

Auspice is a JavaScript program, and requires `Node.js <https://nodejs.org/>`__ to be installed on your system. Refer to ``engines.node`` in `package.json <https://github.com/nextstrain/auspice/blob/-/package.json>`__ for currently supported versions.

We highly recommend using `Conda <https://conda.io/docs/>`__ to manage environments, i.e. use Conda to create an environment with Node.js installed where you can use Auspice. It's possible to use other methods, but this documentation presupposes that you have Conda installed.

To run package scripts, the `bash shell <https://en.wikipedia.org/wiki/Bash_(Unix_shell)>`__ and the `env <https://en.wikipedia.org/wiki/Env>`__ command need to be in your ``PATH``. You should already have them on Unix-like systems including Linux and macOS. If you are working from Windows, you can run the installation under Git Bash, MSYS2, or Cygwin. You can also use the Windows Subsystem Linux for a fuller Linux environment.

Create a Conda Environment
==========================

.. code:: bash

   conda create --name auspice nodejs=14
   conda activate auspice

..

   This parallels `the Nextstrain installation docs <https://nextstrain.org/docs/getting-started/local-installation#install-augur--auspice-with-conda-recommended>`__. You're welcome to use those instead!

Install Auspice from npm
========================

.. code:: bash

   npm install --global auspice

Auspice should now be available as a command-line program - check by running ``auspice --help``.

If you look at the `release notes <https://docs.nextstrain.org/projects/auspice/en/stable/releases/changelog.html>`__ you can see the changes that have been made to Auspice (see your version of Auspice via ``auspice --version``). To upgrade, you can run

.. code:: bash

   npm update --global auspice

Installing from Source
======================

This is useful for debugging, modifying the source code, or using an unpublished feature branch. We're going to assume that you have used Conda to install Node.js as above.

.. code:: bash

   # activate the correct conda enviornment
   conda activate auspice

   # grab the GitHub auspice repo
   git clone https://github.com/nextstrain/auspice.git
   cd auspice

   # install dependencies and make `auspice` available globally
   npm install --global .

   # build auspice (builds the JS client bundle using webpack)
   auspice build

   # test it works
   auspice --version
   auspice --help

   # Obtain nextstrain.org datasets to view locally (optional)
   npm run get-data

Updating Auspice should only require pulling the new version from GitHub - it shouldn't require any ``npm`` commands. You will, however, have to re-build Auspice whenever the client-related code has changed, via ``auspice build``.
