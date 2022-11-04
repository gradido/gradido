# Gradido

Healthy money for a healthy world

![logo](https://gradido.net/wp-content/uploads/2021/06/gradido_logo%E2%97%8Fpreview.png)

The Gradido model can create global prosperity and peace
The Corona crisis has fundamentally changed our world within a very short time.
The dominant financial system threatens to fail around the globe, followed by mass insolvencies, record unemployment and abject poverty. Only with a sustainable new monetary system can humanity master these challenges of the 21st century. The Gradido Academy for Bionic Economy has developed such a system.

Find out more about the Project on its [Website](https://gradido.net/). It is offering vast resources about the idea. The remaining document will discuss the gradido software only.

## Software requirements

Currently we only support `docker` install instructions to run all services, since many different programming languages and frameworks are used.

- [docker](https://www.docker.com/)
- [docker-compose]
- [yarn](https://phoenixnap.com/kb/yarn-windows)

### For Arch Linux

Install the required packages:

```bash
sudo pacman -S docker
sudo pacman -S docker-compose
```

Add group `docker` and then your user to it in order to allow you to run docker without sudo

```bash
sudo groupadd docker # may already exist `groupadd: group 'docker' already exists`
sudo usermod -aG docker $USER
groups # verify you have the group (requires relog)
```

Start the docker service:

```bash
sudo systemctrl start docker
```

### For Windows

#### docker

The installation of dockers depends on your selected product package from the [dockers page](https://www.docker.com/). For windows the product *docker desktop* will be the choice. Please follow the installation instruction of your selected product.

##### known problems

* In case the docker desktop will not start correctly because of previous docker installations, then please clean the used directories of previous docker installation - `C:\Users` -  before you retry starting docker desktop. For further problems executing docker desktop please take a look in this description "[logs and trouble shooting](https://docs.docker.com/desktop/windows/troubleshoot/)"
* In case your docker desktop installation causes high memory consumption per vmmem process, then please take a look at this description "[vmmen process consuming too much memory (Docker Desktop)](https://dev.to/tallesl/vmmen-process-consuming-too-much-memory-docker-desktop-273p)"

#### yarn

For the Gradido build process the yarn package manager will be used. Please download and install [yarn for windows](https://phoenixnap.com/kb/yarn-windows) by following the instructions there.

## How to run?

As soon as the software requirements are fulfilled and a docker installation is up and running then open a powershell on Windows or an other commandline prompt on Linux.

Create and navigate to the directory, where you want to create the Gradido runtime environment.

```
mkdir \Gradido
cd \Gradido
```

### 1. Clone Sources

Clone the repo and pull all submodules

```bash
git clone git@github.com:gradido/gradido.git
git submodule update --recursive --init
```

### 2. Run docker-compose

Run docker-compose to bring up the development environment

```bash
docker-compose up
```

### Additional Build options

If you want to build for production you can do this aswell:

```bash
docker-compose -f docker-compose.yml up
```

## Services defined in this package

- [frontend](./frontend) Wallet frontend
- [backend](./backend) GraphQL & Business logic backend
- [mariadb](./mariadb) Database backend

We are currently restructuring the service to reduce dependencies and unify business logic into one place. Furthermore the databases defined for each service will be unified into one.

### Open the wallet

Once you have `docker-compose` up and running, you can open [http://localhost/](http://localhost/) and create yourself a new wallet account.

## How to release

A release is tagged on Github by its version number and published as github release. This is done automatically when a new version is defined in the [package.json](./package.json) and merged into master - furthermore we set all our sub-package-versions to the same version as the main package.json version to make version management as simple as possible.
Each release is accompanied with release notes automatically generated from the git log which is available as [CHANGELOG.md](./CHANGELOG.md).

To generate the Changelog and set a new Version you should use the following commands in the main folder

```bash
git fetch --all
yarn release
```

The first command `git fetch --all` will make sure you have all tags previously defined which is required to generate a correct changelog. The second command `yarn release` will execute the changelog tool and set version numbers in the main package and sub-packages. It is required to do `yarn install` before you can use this command.
After generating a new version you should commit the changes. This will be the CHANGELOG.md and several package.json files. This commit will be omitted in the changelog.

Note: The Changelog will be regenerated with all tags on release on the external builder tool, but will not be checked in there. The Changelog on the github release will therefore always be correct, on the repo it might be incorrect due to missing tags when executing the `yarn release` command.

## How the different .env work on deploy

Each component (frontend, admin, backend and database) has its own `.env` file. When running in development with docker and nginx you usually do not have to care about the `.env`. The defaults are set by the respective config file, found in the `src/config/` folder of each component. But if you have a local `.env`, the defaults set in the config are overwritten by the `.env`. If you do not use docker, you need the `.env` in the frontend and admin interface because nginx is not running in order to find the backend. 

Each component has a `.env.dist` file. This file contains all environment variables used by the component and can be used as pattern. If you want to use a local `.env`, copy the `.env.dist` and adjust the variables accordingly.

Each component has a `.env.template` file. These files are very important on deploy.

There is one `.env.dist` in the `deployment/bare_metal/` folder. This `.env.dist` contains all variables used by the components, e.g. unites all `.env.dist` from the components. On deploy, we copy this `.env.dist` to `.env` and set all variables in this new file. The deploy script loads this variables and provides them by the `.env.templates` of each component, creating an `.env` for each component (see in `deployment/bare_metal/start.sh` the `envsubst`).

To avoid forgetting to update an existing `.env` in the `deployment/bare_metal/` folder when deploying, we have an environment version variable inside the codebase of each component. You should update this version, when environment variables must be changed or added on deploy. The code checks, that the environement version provided by the `.env` is the one expected by the codebase.


## Troubleshooting

| Problem                                          | Issue                                                | Solution                                                                      | Description                                                                 |
| ------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| docker-compose raises database connection errors | [#1062](https://github.com/gradido/gradido/issues/1062) | End `ctrl+c` and restart the `docker-compose up` after a successful build | Several Database connection related errors occur in the docker-compose log. |
| Wallet page is empty                             | [#1063](https://github.com/gradido/gradido/issues/1063) | Accept Cookies and Local Storage in your Browser                              | The page stays empty when navigating to[http://localhost/](http://localhost/)  |

## Useful Links

- [Gradido.net](https://gradido.net/)


## Attributions

![browserstack_logo-freelogovectors net_](https://user-images.githubusercontent.com/1324583/167782608-0e4db0d4-3d34-45fb-ab06-344aa5e5ef4b.png)

Browser compatibility testing with [BrowserStack](https://www.browserstack.com/).


## License
See the [LICENSE](LICENSE.md) file for license rights and limitations (Apache-2.0 license).

