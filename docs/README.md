# Auspice 'Read The Docs' Documentation.


## Building the docs

Build dependencies are managed with [Conda](https://conda.io).
Install them
into an isolated environment named `auspice-docs` with:

    conda env create

Enter the environment with:

    conda activate auspice-docs

You can now build the documentation with:

    make html

which invokes Sphinx to build static HTML pages in `build/html/`.
You can view them by running:

    open _build/html/index.html

You can clean the build directory for a fresh start with:

    make clean

Leave the environment with:

    conda deactivate
