# Getting started with penguin.js

It's easy to get started. penguin.js embraces the filesystem as its API.

## Create and initialize a project folder

penguin.js treats a website as a node-module. So create a directory and initialize it with a
`package.json`.

    $ mkdir my-site
    $ cd my-site
    $ touch package.json

Now open the `package.json` in your favorite editor and add the following contents.

```json
{
  "scripts": {
    "start": "penguin serve"
  },
  "penguin": {
    "languages": ["en"],
    "components": {
      "Inplace": "penguin.js/inplace",
      "Link": "penguin.js/link"
    }
  }
}
```

Since penguin.js supports multilanguage websites you have to specify at least one language that you want
your website to be in. This is set as you can see in the snippet using `penguin.languages`. The
`penguin.components` entry is a hash that lists all our installed third party components. penguin.js
ships with two builtin components that we just included. We'll see later what we can use them for.

Last but not least we have to install penguin.js. Make sure that you use node v6 or higher.

    $ npm i -S penguin.js

## Start the development server

Now that you created your project folder, go and start the development server using the following
command:

    $ npm start

Maybe you noticed that this runs the `start` script that you declared in your `package.json` in the
previous step. penguin.js makes heavy use of these scripts like we'll see later. You should see
output in your terminal that looks like this:

    > @ start /Users/domachine/Desktop/apps/github.com/domachine/my-site
    > penguin serve

    components.js written
    > Ready on port 3000
    331941 bytes written (1.74 seconds)

## Your first page

If you visit http://localhost:3000/ you'll see a 404 page. That seems bad but it's good! It means
that you're ready to develop your website now! Creating a page in penguin.js is easy. Just create an
html file like this:

    $ mkdir pages
    $ touch pages/index.html

Now edit this file and add some content:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My first page</title>
  </head>
  <body>
    <h1>Home</h1>
    {@link href="/about"}Link to about{/link}
    {@component name="Inplace" tagName="p" field="description"}
      This text is editable
    {/component}
    <script src='/static/client.js'></script>
  </body>
</html>
```

As you can see, we're using some special tags here:

    {@link href="/about"}Link to about{/link}

These are [dustjs](http://www.dustjs.com) helpers that we use to mount components into our site.
If you checkout the page on your http://localhost:3000/ you'll see that the `<p>` is editable.

## Adding a save button

It's nice, that we have an editable element in about 5 minutes. But how to save it? Let's add a save
button for which we have a component. We're all about components :-). The first step is to reference it in your `package.json`.

```json
"penguin": {
  "languages": ["en"],
  "components": {
    "Inplace": "penguin.js/inplace",
    "Link": "penguin.js/link",
    "SaveButton": "penguin.js/save_button"
  }
}
```

Then add it to your page.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My first page</title>
  </head>
  <body>
    <h1>Home</h1>
    {@component name="SaveButton" tagName="button"}Save it!{/component}
    {@link href="/about"}Link to about{/link}
    {@component name="Inplace" tagName="p" field="description"}
      This text is editable
    {/component}
    <script src='/static/client.js'></script>
  </body>
</html>
```

If you now edit your `p` and press save. Just refresh the page and you'll see that it's persistent.

## Add a save indicator to your page

Another missing part is a response to the user if the site was saved successfully. In penguin.js
this is easy and so flexible 'cause hey: We've got a component. Again reference it in your
package.json. It's called `SavedIndicator`.

```json
"penguin": {
  "languages": ["en"],
  "components": {
    "Inplace": "penguin.js/inplace",
    "Link": "penguin.js/link",
    "SaveButton": "penguin.js/save_button",
    "SavedIndicator": "penguin.js/saved_indicator"
  }
}
```

This component has a simple functionality. It defines an html element which is shown when the page
was saved successfully. Checkout the `tagName` and the `className` prop to customize it.

    {@component name="SavedIndicator" tagName="div" className="alert alert-success"}
      Hey, just wrote your stuff to disk, mate!
    {/component}

## Go and try it

This is just the start. We're currently working on making it easy to deploy your site. Stay tuned:
We're moving quickly!

For now you can build your website statically using the following script in your `package.json`:

```json
"scripts": {
  "build": "penguin pack && penguin build"
}
```

Then run `npm run build`. This takes your saved data and builts your website statically to `docs/`.
