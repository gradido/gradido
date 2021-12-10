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

## How to run?

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
- [login_server](./login_server) User credential storage & business logic backend
- [community_server](./community_server/) Business logic backend

We are currently restructuring the service to reduce dependencies and unify business logic into one place. Furthermore the databases defined for each service will be unified into one.

### Open the wallet

Once you have `docker-compose` up and running, you can open [http://localhost/vue](http://localhost/vue) and create yourself a new wallet account.

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

## Troubleshooting

| Problem | Issue | Solution | Description |
| ------- | ----- | -------- | ----------- |
| docker-compose raises database connection errors | [#1062](https://github.com/gradido/gradido/issues/1062) | End `ctrl+c` and restart the `docker-compose up` after a successful build | Several Database connection related errors occur in the docker-compose log. |
| Wallet page is empty | [#1063](https://github.com/gradido/gradido/issues/1063) | Accept Cookies and Local Storage in your Browser | The page stays empty when navigating to [http://localhost/vue](http://localhost/vue) |

## Useful Links

- [Gradido.net](https://gradido.net/)
