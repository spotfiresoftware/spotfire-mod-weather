# Weather Mod for TIBCO Spotfire®

Get live weather information and 7 days forecasts in Spotfire. In addition to instant weather information for a location, this visualization also provides toggleable temperature (°C or °F) in local time and current weather conditions like wind, humidity, visibility and weather description.

Can be used in a variety of analytical dashboards across numerous industry domains like aviation, agriculture, logistics, manufacturing, oil & gas, transportation etc. to provide current weather conditions.

All source code for the mod example can be found in the `src` folder.

## Prerequisites
These instructions assume that you have [Node.js](https://nodejs.org/en/) (which includes npm) installed.

## How to get started (with development server)
- Open a terminal at the location of this example.
- Run `npm install`. This will install necessary tools. Run this command only the first time you are building the mod and skip this step for any subsequent builds.
- Run `npm run server`. This will start a development server.
- Start editing, for example `src/index.js`.
- In Spotfire, follow the steps of creating a new mod and connecting to the development server.

## Working without a development server
- In Spotfire, follow the steps of creating a new mod and then browse for, and point to, the _manifest_ in the `src` folder.
