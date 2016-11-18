# penguinjs

This is a simple building chain for a CMS.

## Directory structure

  * `data/` This contains the data of the CMS. Usually the user input.
  * `pages/` This contains the template source files for the pages (any template language).
  * `objects/` This contains the template sources for the objects (any template language).

## Tools

**bin/create_component_map.js**

This creates an index file for the components and writes it to stdout. You should place the
resulting file to `components.js`. The map is based on the selected field from the `package.json`.

    $ bin/create_component_map.js --query webdesignio.components >components.js

## Commands

**serve**

This starts a development server on `http://localhost:3000` to be used to develop a website.

*Available CLI options*

  * `-v` The view engine to use (default is `html` [dust] but there is also `pug`)

**pack**

This *packs* all the relevant files, builds the component-renderer-script and places all under
`pack/`.

*Available CLI options*

  * `-p` The directory to store the resulting files (default `pack/`)
  * `-v` The view engine to use (default is `html` [dust] but there is also `pug`)

**build**

This renders all templates under `pack/` statically and places the output under `dist/`.

*Available CLI options*

  * `-p` The directory where the packed files are stored (previously generated using `pack`, default
    is `pack/`)
  * `-d` The directory where data files reside in (default is `data/`)
  * `-o` The output where the built files should be stored (default is `dist/`)

## Lowlevel Workflow

Each time you added or removed a component, use `bin/create_component_map.js` to recreate the
component map. As the final step use `bin/pack.js` and `bin/build.js` to build the static files.

## Template languages

Template language should compile the files under `objects/`, `pages/` and place the output under
`pack/`. They are currently abstracted using engines (see `lib/dust_engine.js` and
`lib/pug_engine.js`).
