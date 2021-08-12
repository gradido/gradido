# Gradido

Healthy money for a healthy world

![logo](https://gradido.net/wp-content/uploads/2021/06/gradido_logo%E2%97%8Fpreview.png)

The Gradido model can create global prosperity and peace
The Corona crisis has fundamentally changed our world within a very short time.
The dominant financial system threatens to fail around the globe, followed by mass insolvencies, record unemployment and abject poverty. Only with a sustainable new monetary system can humanity master these challenges of the 21st century. The Gradido Academy for Bionic Economy has developed such a system.

## Software requirements

Currently we only support `docker` as environment to run all services, since many different programming languages and frameworks are used.

- [docker](https://www.docker.com/)

## How to run?

1. Clone the repo and pull all submodules

```bash
git clone git@github.com:gradido/gradido.git
git submodule update --recursive --init
```

2. Run docker compose
    1. Run docker compose for the debug build

    ```bash
    docker-compose up
    ```

   2. Or run docker compose in production build

    ```bash
    docker-compose -f docker-compose.yml up
    ```

## Useful Links

- [Gradido.net](https://gradido.net/)
- [Discord](https://discord.gg/kA3zBAKQDC)
