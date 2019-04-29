# Auspice.us

Auspice.us, pronounced "auspicious" (/ɔːˈspɪʃəs/), is an interactive web-app for visualising phylogenomic datasets.
It is currently available at [auspice-us-dev.herokuapp.com](http://auspice-us-dev.herokuapp.com/).

> Auspice.us is currently under development will change frequently


## How to run

All commands run from this directory (`auspice.us`) and assume that auspice is installed globally.


#### Development
```
auspice develop --verbose --extend client-customisations/config.json
```

#### Production Build
```
auspice build --verbose --extend client-customisations/config.json
auspice view --verbose --handlers server-customisations/handlers.js --customBuild
```
