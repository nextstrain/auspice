# Client Customisation API

> The functionality detailed in this page needs more attention, both in terms of testing and code development.
We expect there to be some bugs and possible API changes.
If you rely on this functionality, we recommend you pin your installation of Auspice to a specific version.
Please [get in touch with us](mailto:hello@nextstrain.org) if you are using these customisations so that we can work with you!


This page details the available options and format of the customisations available at (client) build time.
They are contained in a JSON file supplied to Auspice via
```bash
auspice build --extend <JSON>
```


*Note that the hot-reloading development functionality does not work for code which is included via this client customisation mechanism.*
*Thus, while you can run `auspice develop --extend <JSON>` it will not update as you may expect!*


## Available Customisations
The following are definable as top-level keys of the JSON file.
A useful reference may be the [customisation JSON file](https://github.com/nextstrain/nextstrain.org/blob/master/auspice-client/customisations/config.json) used by nextstrain.org.

* `sidebarTheme` allows modifications to the aesthetics of the sidebar. See below.
* `navbarComponent` a (relative) path to a JS file exporting a React component to be rendered as the nav bar. See below.
* `browserTitle` The browser title for the page. Defaults to "auspice" if not defined.
* `googleAnalyticsKey` You can specify a Google Analytics key to enable (some) analytics functionality. More documentation to come.
* `serverAddress` Specify the address / prefix which the auspice client uses for API requests.

---

### Sidebar Theme

The appearence of the sidebar can be customised by specifing a theme in the config JSON used to build Auspice.
This theme is then available (via [styled-components](https://www.styled-components.com/)) to the components rendered in the sidebar.
It is also passed to the nav bar component (see below) as the `theme` prop.

For instance, here is the customisation used by nextstrain.org:

```json
{
  "sidebarTheme": {
    "background": "#F2F2F2",
    "color": "#000",
    "sidebarBoxShadow": "rgba(0, 0, 0, 0.2)",
    "font-family": "Lato, Helvetica Neue, Helvetica, sans-serif",
    "selectedColor": "#5097BA",
    "unselectedColor": "#333"
  }
}
```


| Properties         | CSS string of       | Description                                       |
| -------------     |---------------      | ------                                            |
| color             | color               |  Text color                                         |
| selectedColor      | color              | Text color of selected text / button text |
| unselectedColor   | color               | Text color of unselected text / button text |
| font-family        | font               |  Inner shadow of the sidebar on the right hand side |
| background        | color               | Background color                                    |



## Components

One way to extend Auspice is by replacing React components with your own custom components.
These custom components will receive props defined here, which can be used to update the rendering of the component using the normal react lifecycle methods.
Right now this is only available for the splash page and nav-bar components, whose interfaces are defined here.

Each component must be the default export of a javascript file which is specified in the (client) config JSON passed to Auspice at build time (`auspice build` or `auspice develop`).


### Nav-bar Component

**Build config:**
```json
{
  "navbarComponent": "<relative path to javascript file>"
}
```

Where the javascript file contains a default export of a React component.

**React Props Available:**

|  Prop            | Type      | Description                                       |
| -----------      |---------  | ------                                            |
| `narrativeTitle` | String |       |
| `sidebar        ` | Bool | Is it to be displayed in the sidebar? |
| `width        ` | Number | Width of the sidebar, in pixels |
| `theme        ` | Object | See above. Use this to style components. |



### Splash component

Define a custom splash page for Auspice. Please note that this is extremely expirimental and the interface is expected to change.

**Build config:**
```json
{
  "splashComponent": "<relative path to javascript file>"
}
```
Where the javascript file contains a default export of a React component.

**React Props available:**

|  Prop         | Type      | Description                                       |
| -----------   |---------  | ------                                            |
| `isMobile` | Bool |       |
| `available` | Object |  available datasets and narratives |
| `browserDimensions` | Object | Browser width & height |
| `dispatch` | function | access to redux's dispatch mechanism |
| `errorMessage` | function | to do |
| `changePage` | function | to do |

---

### Specifying the API server address

By default, the client makes API requests ([as detailed here](requests.md)) to "/charon/getAvailable", "/charon/getDataset" etc.
This is using the default server address of "/charon".
This can be changed by specifying `serverAddress` in the customisation JSON.

> Note that currently you can't specify a different domain due to CORS headers.
This may well be a simple fix -- please get in touch if you can help here!
