# Dock Spawn

Panel docking library that provides panel docking similar to how Visual Studio handles dockable panels.

This project is originally forked from: https://github.com/northerneyes/dock-spawn.

You can find everything you need in the `dist/` folder.

This fork include the following changes:

- use gulp, browserify and uglify
- correct tab shadow
- correct tab behavior when changing their order
- do not remove hidden panel from DOM
- split CSS style into 3 files


## Installation

in the root folder run:

    npm install

then run gulp:

    ./node_modules/.bin/gulp

All files are generated in dist.

## Develop
The dev mode is useful to rebuild automatically the project when file are modified.

    ./node_modules/.bin/gulp dev

## Run JSHint
To have some warning on the code use jshint.

    ./node_modules/.bin/gulp jshint
