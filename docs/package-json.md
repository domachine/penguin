# Configuration in package.json

The package.json is used to configure the included components in the website. All components in
`components/` are automatically included. To use third-party components (even penguin.js components)
they need to be listed in the package.json like this:

```
{
  ...
  "penguin": {
    "components": {
      "Link": "penguin.js/link"
    }
  }
  ...
}
```

The key of the object is the name of the component with which it can be instantiated in a template.
The value is the path to the module. We use the nodejs resolution algorithm to find them.
