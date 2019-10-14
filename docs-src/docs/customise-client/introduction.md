---
title: Customising auspice
---


Auspice allows you to customise the appearance and functionality of auspice [when the client is built](introduction/cli.md#build).
This is how auspice running locally and nextstrain.org look different, despite both using "auspice". 


![mumps](assets/auspice-vs-nextstrain.png)
*Notice the difference? Default auspice (left) and nextstrain.org's customised version (right)*


This is achieved by providing a JSON at build time to auspice which defines the desired customisations via:
```bash
auspice build --extend <JSON>
```

[Here's](https://github.com/nextstrain/nextstrain.org/blob/master/auspice/client/config.json) the file used by nextstrain.org to change the appearance of auspice in the above image.


See the [client customisation API](customise-client/api.md) for the available options. 



