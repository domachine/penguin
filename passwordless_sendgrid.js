'use strict'

const nodemailer = require('nodemailer')

module.exports = ({
  subject = 'Penguin.js passwordless',
  'api-key': apiKey,
  from,
  url
}) => {
  if (!from) throw new Error('Need a from parameter')
  const transport = nodemailer.createTransport({
    service: 'SendGrid',
    auth: { user: 'apikey', pass: apiKey }
  })
  return (tokenToSend, uidToSend, recipient, callback) => {
    transport.sendMail({
      subject,
      from,
      to: recipient,
      text:
`Hello!

Access your account here:
${url}/auth/passwordless/login?token=${tokenToSend}&uid=${encodeURIComponent(uidToSend)}
`
    }, err => {
      if (err) return callback(err)
      callback()
    })
  }
}
