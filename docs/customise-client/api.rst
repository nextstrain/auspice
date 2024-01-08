Client Customisation API
========================

.. warning::

   The functionality detailed in this page needs more attention, both in terms of testing and code development. We expect there to be some bugs and possible API changes. If you rely on this functionality, we recommend you pin your installation of Auspice to a specific version. Please `get in touch with us <https://nextstrain.org/contact>`__ if you are using these customisations so that we can work with you!

This page details the available options and format of the customisations available at (client) build time. They are contained in a JSON file supplied to Auspice via

.. code:: bash

   auspice build --extend <JSON>

.. note::

   The hot-reloading development functionality does not work for code which is included via this client customisation mechanism. Thus, while you can run ``auspice develop --extend <JSON>`` it will not update as you may expect!

.. _client-api-available-customisations:

Available Customisations
------------------------

The following are definable as top-level keys of the JSON file. A useful reference may be the `customisation JSON file <https://github.com/nextstrain/nextstrain.org/blob/master/auspice-client/customisations/config.json>`__ used by nextstrain.org.

-  ``sidebarTheme`` allows modifications to the aesthetics of the sidebar. See below.
-  ``navbarComponent`` a (relative) path to a JS file exporting a React component to be rendered as the nav bar. See below.
-  ``splashComponent`` a (relative) path to a JS file exporting a React component to be rendered as the splash page. See below.
-  ``browserTitle`` The browser title for the page. Defaults to "auspice" if not defined.
-  ``finePrint`` String of Markdown to add to the "fine print" at the bottom of pages.
-  ``plausibleDataDomain`` plausible.io analytics (see below)
-  ``googleAnalyticsKey`` You can specify a Google Analytics key to enable (some) analytics functionality. This is deprecated and will be removed from an upcoming release.
-  ``serverAddress`` Specify the address / prefix which the auspice client uses for API requests.
-  ``mapTiles`` Specify the address (and other information) for the tiles used to render the map.

.. note::

   Please remember to make any modifications, including customisations described here, publicly available. See :doc:`the previous page <overview>` for more details.

--------------

Sidebar Theme
~~~~~~~~~~~~~

The appearence of the sidebar can be customised by specifing a theme in the config JSON used to build Auspice. This theme is then available (via `styled-components <https://www.styled-components.com/>`__) to the components rendered in the sidebar. It is also passed to the nav bar component (see below) as the ``theme`` prop.

For instance, here is the customisation used by nextstrain.org:

.. code:: json

   {
     "sidebarTheme": {
       "background": "#F2F2F2",
       "color": "#000",
       "sidebarBoxShadow": "rgba(0, 0, 0, 0.2)",
       "font-family": "Lato, Helvetica Neue, Helvetica, sans-serif",
       "selectedColor": "#5097BA",
       "unselectedColor": "#333",
       "alternateBackground": "#888"
     }
   }

+-----------------------------------+---------------+------------------------------------------------------------------------------+
| Properties                        | CSS string of | Description                                                                  |
+===================================+===============+==============================================================================+
| selectedColor                     | color         | Text color of selected text / button text                                    |
+-----------------------------------+---------------+------------------------------------------------------------------------------+
| unselectedColor                   | color         | Text color of unselected text / button text                                  |
+-----------------------------------+---------------+------------------------------------------------------------------------------+
| color                             | color         | Text color of all other text                                                 |
+-----------------------------------+---------------+------------------------------------------------------------------------------+
| unselectedBackground (deprecated) | color         | Old key for ``alternateBackground``                                          |
+-----------------------------------+---------------+------------------------------------------------------------------------------+
| alternateBackground               | color         | Background color of some elements (unselected toggle, panel section borders) |
+-----------------------------------+---------------+------------------------------------------------------------------------------+
| font-family                       | font          | Font used throughout the sidebar                                             |
+-----------------------------------+---------------+------------------------------------------------------------------------------+
| background                        | color         | Background color of the entire sidebar                                       |
+-----------------------------------+---------------+------------------------------------------------------------------------------+

Components
----------

One way to extend Auspice is by replacing React components with your own custom components. These custom components will receive props defined here, which can be used to update the rendering of the component using the normal react lifecycle methods. Right now this is only available for the splash page and nav-bar components, whose interfaces are defined here.

Each component must be the default export of a javascript file which is specified in the (client) config JSON passed to Auspice at build time (``auspice build`` or ``auspice develop``).

Nav-bar Component
~~~~~~~~~~~~~~~~~

**Build config:**

.. code:: json

   {
     "navbarComponent": "<relative path to javascript file>"
   }

Where the javascript file contains a default export of a React component.

**React Props Available:**

+-----------------------------+-----------------------+------------------------------------------+
| Prop                        | Type                  | Description                              |
+=============================+=======================+==========================================+
| ``narrativeTitle``          | String                |                                          |
+-----------------------------+-----------------------+------------------------------------------+
| ``sidebar``                 | Bool                  | Is it to be displayed in the sidebar?    |
+-----------------------------+-----------------------+------------------------------------------+
| ``width``                   | Number                | Width of the sidebar, in pixels          |
+-----------------------------+-----------------------+------------------------------------------+
| ``theme``                   | Object                | See above. Use this to style components. |
+-----------------------------+-----------------------+------------------------------------------+

Splash component
~~~~~~~~~~~~~~~~

Define a custom splash page for Auspice. Please note that this is extremely expirimental and the interface is expected to change.

**Build config:**

.. code:: json

   {
     "splashComponent": "<relative path to javascript file>"
   }

Where the javascript file contains a default export of a React component.

**React Props available:**

+-----------------------------+-----------------------+--------------------------------------+
| Prop                        | Type                  | Description                          |
+=============================+=======================+======================================+
| ``isMobile``                | Bool                  |                                      |
+-----------------------------+-----------------------+--------------------------------------+
| ``available``               | Object                | available datasets and narratives    |
+-----------------------------+-----------------------+--------------------------------------+
| ``browserDimensions``       | Object                | Browser width & height               |
+-----------------------------+-----------------------+--------------------------------------+
| ``dispatch``                | function              | access to redux's dispatch mechanism |
+-----------------------------+-----------------------+--------------------------------------+
| ``errorMessage``            | function              | to do                                |
+-----------------------------+-----------------------+--------------------------------------+
| ``changePage``              | function              | to do                                |
+-----------------------------+-----------------------+--------------------------------------+

--------------

Specifying the API server address
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

By default, the client makes API requests (:doc:`as detailed here <requests>`) to "/charon/getAvailable", "/charon/getDataset" etc. This is using the default server address of "/charon". This can be changed by specifying ``serverAddress`` in the customisation JSON.

.. note::

   If you specify a ``serverAddress`` on a different origin (protocol + domain + port) than Auspice, the server will need to send CORS headers to permit the requests from Auspice.

--------------

Custom Map tiles
~~~~~~~~~~~~~~~~

Auspice uses `Leaflet <https://leafletjs.com/>`__ to render the map, which requires access to a tile set in order to render the geography. By default, auspice uses `Mapbox <https://www.mapbox.com/>`__ for these tiles, and we make these available for local use of auspice. If you are distributing your own version of auspice (i.e. not running it locally) you must set an appropriate API address here so that the map can fetch suitable tiles.

.. code:: json

   {
     "mapTiles": {
       "api": "API address for Leaflet to fetch map tiles",
       "attribution": "HTML-formatted attribution string to be displayed in bottom-right-hand corner of map",
       "mapboxWordmark": "(optional) should the Mapbox logo be displayed in the bottom-left of the map? (boolean)"
     }
   }

Please see `this discussion post <https://discussion.nextstrain.org/t/build-with-newest-nextstrain-ncov-has-api-requests-to-mapbox-403-forbidden/396/11?u=james>`__ for a hands-on guide to setting custom map tile info. For some examples of other tile sets you may use, see the `OpenStreetMap wiki <https://wiki.openstreetmap.org/wiki/Tile_servers>`__, and please remember to adhere to the licenses and terms of use for each tile server. The API address contains parameters as specified by the `Leaflet API <https://docs.mapbox.com/api/overview/>`__.

--------------

Tracking Analytics
~~~~~~~~~~~~~~~~~~

Auspice has in-built support for `Plausible Analytics <https://plausible.io/docs>`__. To enable this you will need to provide the ``plausibleDataDomain`` in your extensions. The analytics are not included when running Auspice in development mode.

Auspice has support for Google Analytics but this is deprecated and will be removed in a future release. Google Analytics run when the ``googleAnalyticsKey`` extension is set and only run in production mode.
