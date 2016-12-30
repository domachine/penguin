'use strict'

module.exports = () =>
`<html>
  <head>
    <title>File not found!</title>
    <style>
      .error {
        color: #000;
        background: #fff;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        position: absolute;
        font-family: -apple-system, BlinkMacSystemFont, Roboto, "Segoe UI", "Fira Sans", Avenir, "Helvetica Neue", "Lucida Grande", sans-serif;
        text-align: center;
        padding-top: 20%;
      }

      .desc {
        display: inline-block;
        text-align: left;
        line-height: 49px;
        height: 49px;
        vertical-align: middle;
      }

      .h1 {
        display: inline-block;
        border-right: 1px solid rgba(0, 0, 0,.3);
        margin: 0;
        margin-right: 20px;
        padding: 10px 23px;
        font-size: 24px;
        font-weight: 500;
        vertical-align: top;
      }

      .h2 {
        font-size: 14px;
        font-weight: normal;
        margin: 0;
        padding: 0;
      }

      .footer {
        position: absolute;
        width: 100%;
        bottom: 0;
        height: 50px;
        font-family: monospace;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class='error'>
      <div class='text'>
        <h1 class='h1'>404</h1>
        <div class='desc'>
          <h2 class='h2'>
            File not found.<br />
          </h2>
        </div>
        <p>
          <code>
            /* Replace this with your own error-page by creating files/404.html */
          </code>
        </p>
      </div>
    </div>
    <div class='footer'>
      &lt;penguin.js&gt; | <a href='https://github.com/domachine/penguin.js'>Github</a>
    </div>
  </body>
</html>
`
