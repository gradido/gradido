# Using  `forwardemail`–`email-templates` With `pug` Package

You'll find the GitHub repository of the `email-templates` package and the `pug` package here:

- [email-templates](https://github.com/forwardemail/email-templates)
- [pug](https://www.npmjs.com/package/pug)

## `pug` Documentation

The full `pug` documentation you'll find here:

- [pugjs.org](https://pugjs.org/)

### Caching Possibility

In case we are sending many emails in the future there is the possibility to cache the `pug` templates:

- [cache-pug-templates](https://github.com/ladjs/cache-pug-templates)

## Testing

To test your send emails you have different possibilities:

### In General

To send emails to yourself while developing set in `.env` the value `EMAIL_TEST_MODUS=true` and `EMAIL_TEST_RECEIVER` to your preferred email address.

### Unit Or Integration Tests

To change the behavior to show previews etc. you have the following options to be set in `sendEmailTranslated.ts` on creating the email object:

```js
  const email = new Email({
    …
    // send emails in development/test env:
    send: true,
    …
    // to open send emails in the browser
    preview: true,
    // or
    // to open send emails in a specific the browser
    preview: {
      open: {
        app: 'firefox',
        wait: false,
      },
    },
    …
  })
```
