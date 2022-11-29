# Contributing

If you contribute to our project, please consider the following points.

## Localization

### Quotation Marks

The following characters are different from the programming quotation mark:

`"` or `\"`

Please copy and paste the following quotes for the languages:

- de: „Dies ist ein Beispielsatz.“
- en: “This is a sample sentence.”
  - See <https://grammar.collinsdictionary.com/easy-learning/when-do-you-use-quotation-marks-or-in-english>

## Docker – More Closely

### Apple M1 Platform

***Attention:** For using Docker commands in Apple M1 environments!*

#### Environment Variable For Apple M1 Platform

To set the Docker platform environment variable in your terminal tab, run:

```bash
# set env variable for your shell
$ export DOCKER_DEFAULT_PLATFORM=linux/amd64
```

#### Docker Compose Override File For Apple M1 Platform

For Docker compose `up` or `build` commands, you can use our Apple M1 override file that specifies the M1 platform:

```bash
# in main folder

# for development
$ docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.apple-m1.override.yml up

# for production
$ docker compose -f docker-compose.yml -f docker-compose.apple-m1.override.yml up
```

### Analyzing Docker Builds

To analyze a Docker build, there is a wonderful tool called [dive](https://github.com/wagoodman/dive). Please sponsor if you're using it!

The `dive build` command is exactly the right one to fulfill what we are looking for.
We can use it just like the `docker build` command and get an analysis afterwards.

So, in our main folder, we use it in the following way:

```bash
# in main folder
$ dive build --target <layer-name> -t "gradido/<app-name>:local-<layer-name>" <app-folder-name-or-dot>/
```

For the specific applications, see our [publish.yml](.github/workflows/publish.yml).
