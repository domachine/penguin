'use strict'

const nodemailer = require('nodemailer')

module.exports = ({ subject = 'Penguin.js passwordless', from, url }) => {
  if (!from) {
    throw new Error('Need a from parameter')
  }
  const transport = nodemailer.createTransport({
    service: 'SendGrid',
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  })
  return (tokenToSend, uidToSend, recipient, callback) => {
    transport.sendMail({
      subject: 'Penguin',
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
