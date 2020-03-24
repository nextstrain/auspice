---
title: Customising Auspice
---


Auspice allows you to customise the appearance and functionality of Auspice [when the client is built](introduction/how-to-run.md#auspice-build).
This is how Auspice running locally and nextstrain.org look different, despite both using "Auspice".


![mumps](assets/auspice-vs-nextstrain.png)
*Notice the difference? Default Auspice (left) and nextstrain.org's customised version (right)*


This is achieved by providing a JSON at build time to Auspice which defines the desired customisations via:
```bash
auspice build --extend <JSON>
```

[Here's](https://github.com/nextstrain/nextstrain.org/blob/master/auspice-client/customisations/config.json) the file used by nextstrain.org to change the appearance of Auspice in the above image.


See the [client customisation API](customise-client/api.md) for the available options.



