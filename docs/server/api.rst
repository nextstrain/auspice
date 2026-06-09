Server API
==========

Auspice client requests
-----------------------

The Auspice server handles requests to 3 API endpoints made by the Auspice client:

* ``/charon/getAvailable`` (returns a list of available datasets and narratives)
* ``/charon/getDataset`` (returns the requested dataset)
* ``/charon/getNarrative`` (returns the requested narrative)

.. _server-api-charon-getavailable:

``/charon/getAvailable``
~~~~~~~~~~~~~~~~~~~~~~~~

**URL query arguments:**

-  ``prefix`` (optional) - the pathname of the requesting page in Auspice. The ``getAvailable`` handler can use this to respond according appropriately. Unused by the default Auspice handler.

**JSON Response (on success):**

.. code:: json

   {
     "datasets": [
       {
         "request": "[required] The pathname of a valid dataset. \
             Will become the prefix of the getDataset request.",
         "buildUrl": "[optional] A URL to display in the sidebar representing \
             the build used to generate this analysis.",
         "secondTreeOptions": "[optional] A list of requests which should \
             appear as potential second-trees in the sidebar dropdown"
       },
       // ...
     ],
     "narratives": [
       {"request": "URL of a narrative. Will become the prefix in a getNarrative request"},
       // ...
     ]
   }

Failure to return a valid JSON will result in a warning notification shown in Auspice.

``/charon/getDataset``
~~~~~~~~~~~~~~~~~~~~~~

**URL query arguments:**

-  ``prefix`` (required) - the pathname of the requesting page in Auspice. Use this to determine which dataset to return.
-  ``type`` (optional) -- if specified, then the request is for an additional file (e.g. "tip-frequencies"), not the main dataset.

**JSON Response (on success):**

The JSON response depends on the file-type being requested.

If the type is not specified, i.e. we're requesting the "main" dataset JSON then `see this JSON schema <https://github.com/nextstrain/augur/blob/master/augur/data/schema-export-v2.json>`__. Note that the Auspice client *cannot* process v1 (meta / tree) JSONs -- :ref:`see below <server-api-importing-code-from-auspice>` for how to convert these.

Alternative file type reponses are to be documented.

**Alternative responses:**

A ``204`` reponse will cause Auspice to show its splash page listing the available datasets & narratives. Any other non-200 reponse behaves similarly but also displays a large "error" message indicating that the dataset was not valid.

.. _server-api-charon-getnarrative:

``/charon/getNarrative``
~~~~~~~~~~~~~~~~~~~~~~~~

**URL query arguments:**

-  ``prefix`` (required) - the pathname of the requesting page in Auspice. Use this to determine which narrative to return.
-  ``type`` (required) - this must be ``type=md`` for historical reasons

**Response (on success):**

The narrative file is sent to the client (unmodified, to be parsed client-side).


--------------

.. _server-api-supplying-custom-handlers:

Supplying custom handlers to the Auspice server
-----------------------------------------------

The provided Auspice servers -- i.e. ``auspice view`` and ``auspice develop`` both have a ``--handlers <JS>`` option which allows you to define your own handlers. The provided JavaScript file must export three functions, each of which handles one of the GET requests described above and must respond accordingly (see above for details).

============= ========= ====================
function name arguments API endpoint
============= ========= ====================
getAvailable  req, res  /charon/getAvailable
getDataset    req, res  /charon/getDataset
getNarrative  req, res  /charon/getNarrative
============= ========= ====================

For information about the ``req`` and ``res`` arguments see the express documentation for the `request object <https://expressjs.com/en/api/request/>`__ and `response object <https://expressjs.com/en/api/response/>`__, respectively.

You can see `nextstrain.org <https://nextstrain.org>`__'s implementation of these handlers `here <https://github.com/nextstrain/nextstrain.org/tree/HEAD/src/app.js>`__.

Here's a pseudocode example of an implementation for the ``getAvailable`` handler which may help understanding:

.. code:: js

   const getAvailable = (req, res) => {
     try {
       /* collect available data */
       res.json(data);
     } catch (err) {
       const errorMessage = `error message to display in client`;
       console.log(errorMessage); /* printed by the server, not the client */
       return res.status(500).type("text/plain").send(errorMessage);
     }
   };

--------------

.. _server-api-importing-code-from-auspice:

Importing code from Auspice
---------------------------

While Auspice is predominantly a frontend (client) app, it also contains some functionality that you may wish to use in a custom nodejs script/app.
Currently there is one exported function, ``convertFromV1``.

.. _server-api-convertfromv1:

``convertFromV1``
~~~~~~~~~~~~~~~~~

**Signature:**

.. code:: js

   import { convertFromV1 } from "auspice";
   const v2json = convertFromV1({tree, meta})

where ``tree`` is the v1 tree JSON, and ``meta`` the v1 meta JSON.

**Returns:**

An object representing the v2 JSON `defined by this schema <https://github.com/nextstrain/augur/blob/master/augur/data/schema-export-v2.json>`__.
