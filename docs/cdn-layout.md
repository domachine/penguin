# CDN Layout

The output is built in the following structure.

    docs/
      templates/
        pages/
          <name>.html
          <name>.json
        objects/
          ...
      data/
        website.json
        pages.json
        pages/
          <name>.json
        objects.json
        objects/
          <id>.json
      static/
        ...
      ...

**directories**

  * `docs` - This is the root folder which chosen in convention for github pages.
  * `templates` - This folder contains all built templates and their json representation for easy
    fetching.
  * `data` - This folder contains the json data submitted by the website editor. It also includes
    index files (`pages.json`, `objects.json`) which allow to fetch data in bulk manner.
  * `static` - This contains the static files for the website.

The rest of the files in the folder are statically built HTML files.
