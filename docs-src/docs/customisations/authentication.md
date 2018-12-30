---
title: Authentication
---


We understand it may be necessary to authenticate the entire auspice website, or certain datasets.
Our proposed solution to this is to perform all authentication on the server (remember that custom server handlers are already part of the auspice extension framework).
This relies on cookies (?) being available to the server on each and every request made from auspice, which should happen automatically.


> Note that this approach is still in the experimental stage. Comments welcome.


## Logging in / authenticating:

The intial request (which currently serves ) shall check that the user is authenticaed.
If so, it can deliver the auspice `index.html`.
If not, it can redirect to a login page which will set this cookie.
Note that this login page is deliberately _not_ part of auspice.


The login details (e.g. username) could be available to auspice via the `getAvailable` request (_to explore_).
We will design a (customisable) login button / logged in user for auspice.
It may be that the "login" button redirects to `/login` which is handled by the server as above.


## Restricting datasets:
The datasets which are "available" to the client can be controlled by the server, such that only those with sufficient permissions are returned when the `getAvailable` request is processed.
Likewise, requests for `getDataset` can be checked against the current cookie.
