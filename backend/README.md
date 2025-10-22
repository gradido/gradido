# backend

## Project setup

## Seed DB

```bash
turbo seed
```

Deletes all data in database. Then seeds data in database.

## Seeded Users

| email                  | password   | admin   | email checked | deleted |
|------------------------|------------|---------|---------------|---------|
| peter@lustig.de        | `Aa12345_` | `true`  | `true`        | `false` |
| bibi@bloxberg.de       | `Aa12345_` | `false` | `true`        | `false` |
| raeuber@hotzenplotz.de | `Aa12345_` | `false` | `true`        | `false` |
| bob@baumeister.de      | `Aa12345_` | `false` | `true`        | `false` |
| garrick@ollivander.com |            | `false` | `false`       | `false` |
| stephen@hawking.uk     | `Aa12345_` | `false` | `true`        | `true`  |

## Setup GraphQL Playground

### Setup In The Code

Setting up the GraphQL Playground in our code requires the following steps:

- Create an empty `.env` file in the `backend` folder and set "GRAPHIQL=true" there.
- Start or restart Docker Compose.
- For verification, Docker should display `GraphQL available at http://localhost:4000` in the terminal.
- If you open "http://localhost:4000/" in your browser, you should see the GraphQL Playground.

### Authentication

You need to authenticate yourself in GraphQL Playground to be able to send queries and mutations, to do so follow the steps below:

- in Firefox go to "Network Analysis" and delete all entries
- enter and send the login query:

```gql
{
  login(email: "bibi@bloxberg.de", password:"Aa12345_") {
    id
    publisherId
    email
    firstName
    lastName
    emailChecked
    language
    hasElopage
  }
}
```

- search in Firefox under „Network Analysis" for the smallest size of a header and copy the value of the token
- open the header section in GraphQL Playground and set your current token by filling in and replacing `XXX`:

```qgl
{
  "Authorization": "XXX"
}
```

Now you can open a new tap in the Playground and enter your query or mutation there.
