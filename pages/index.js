module.exports = ({ languages }) =>
`<!DOCTYPE html>
<html>
  <head>
    <title>Redirecting ...</title>
    <meta http-equiv='refresh' content='0; URL=/${languages[0]}/'>
  </head>
  <body>
    Redirecting <a href='/${languages[0]}/'>here</a> ...
  </body>
</html>`
