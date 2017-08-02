# autobumper
Bumps the version of all the packages based on git history

## Install
```npm i autobumper```

## Folder structure

Its great suited for a folder structure where each package is in its own folder

project

   * package1
   * package2
   * package3


## CLI usage

```node node_modules/autobumper --dir ./project```

## From Node

```
const autobumper = require('autobumper')
autobumper('./project')
```
