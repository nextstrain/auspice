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

## Deploying
Auspice.us is currently deployed as the heroku web process of the main auspice repo.
Any pushes of that repo to the heroku server will redeploy this via:
1. Running the `npm run heroku-postbuild` hook in lieu of the normal `npm run build` hook. This builds auspice.us (see above).
1. The Procfile runs `npm run start-auspice-us` which runs the `auspice view` command detailed above.
