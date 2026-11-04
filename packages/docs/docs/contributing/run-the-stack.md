---
sidebar_position: 20
toc_max_heading_level: 4
---

# Run the Stack

Follow these instructions to get the complete Medplum stack running directly on your host machine.

<div className="responsive-iframe-wrapper">
  <iframe width="560" height="315" src="https://www.youtube.com/embed/nf6OElRWOJ4" title="YouTube video player" frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

## Prerequisites

1. **[Git](https://git-scm.com/)**
2. **[Node.js](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)** (`>=22.22.0 <23` or `>=24.2.0 <25`, matching the root `package.json` `engines` field)
3. **[Docker](https://docs.docker.com/engine/install/)**
4. [Clone the Medplum repo](./local-dev-setup#clone-the-repo)

## Install

Our monorepo uses [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces), so installing dependencies for all projects is done using normal `npm install`:

```sh
cd medplum
npm ci
```

## Build

Use Turborepo to build all packages.

From your root medplum directory run:

```sh
npm run build:fast
```

## Background services

The Medplum Stack requires the following services to be running in your environment:

- [PostgreSQL](https://www.postgresql.org/) for the primary database
- [Redis](https://redis.com/) for caching and job queueing

When running these services on your local machine you can either use Docker (recommended) or install them directly onto your machine.

### Using Docker (Recommended)

Use the supplied `docker-compose.yml` file to run PostgreSQL 16 and Redis 7. These are background services only — this file does not start the Medplum API or app. For a one-command API plus app, see [Running the Full Medplum Stack in Docker](/docs/self-hosting/running-full-medplum-stack-in-docker).

From your root `medplum` directory run:

```sh
docker compose up
```

(`docker-compose` with a hyphen still works on some installs. Prefer the Compose V2 plugin shown above.)

This will:

1. Start PostgreSQL 16 on port `5432` with user, password, and database `medplum` (Postgres creates that database because `POSTGRES_USER=medplum`)
2. Apply [postgres.conf](https://github.com/medplum/medplum/blob/main/postgres/postgres.conf)
3. Run [init_test.sql](https://github.com/medplum/medplum/blob/main/postgres/init_test.sql), which creates the extra `medplum_test` and `medplum_test_shard_1` databases used by unit tests — not the application database
4. Start Redis 7 on port `6379` with password `medplum`

When `docker-compose` completes, you should see something like this in your terminal:

```bash
postgres-1  | PostgreSQL init process complete; ready for start up.
postgres-1  |
postgres-1  | 2024-12-13 17:27:57.492 GMT [1] LOG:  starting PostgreSQL 16.5 (Debian 16.5-1.pgdg120+1) on aarch64-unknown-linux-gnu, compiled by gcc (Debian 12.2.0-14) 12.2.0, 64-bit
postgres-1  | 2024-12-13 17:27:57.492 GMT [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
postgres-1  | 2024-12-13 17:27:57.492 GMT [1] LOG:  listening on IPv6 address "::", port 5432
postgres-1  | 2024-12-13 17:27:57.493 GMT [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
postgres-1  | 2024-12-13 17:27:57.495 GMT [67] LOG:  database system was shut down at 2024-12-13 17:27:57 GMT
postgres-1  | 2024-12-13 17:27:57.508 GMT [1] LOG:  database system is ready to accept connections
```

**(Optional)** If you'd like to run a `psql` to shell to inspect the database, you can run

```sh
docker exec -it medplum-postgres-1 psql -U medplum
```

Where `medplum-postgres-1` can be replaced with the name of your postgres docker container.

### Deploying manually

If you'd prefer to install the dependencies directly, you can find installation instructions for the required services below:

1. [Install PostgreSQL](https://www.postgresql.org/download/) (16 is what `docker-compose.yml` ships; 13 may still work for older local installs)
2. [Install Redis](https://redis.io/download) (7 required; Redis 6 support was dropped in Medplum v5)

After that, you will have to update the file `packages/server/medplum.config.json`

```js
  "database": {
    "host": "",     // YOUR POSTGRESQL HOST
    "port": "",     // YOUR POSTGRESQL PORT
    "dbname": "",   // YOUR POSTGRESQL DB Name
    "username": "", // YOUR POSTGRESQL USERNAME
    "password": ""  // YOUR POSTGRESQL PASSWORD
  },
    "redis": {
    "host": "",     // YOUR REDIS HOST
    "port": "",     // YOUR REDIS PORT
    "password": "", // YOUR REDIS PASSWORD
  }
```

## Run tests (optional)

Use Turborepo to run all tests across all packages.

From your root medplum directory run:

```sh
npm t
```

## Run

### Start the servers

After you have PostgreSQL and Redis up and running, you can run the Medplum API server.

From your root `medplum` directory run:

```sh
cd packages/server
npm run dev
```

This seeds the Super Admin user and project. It does not create sample patients. The email and password are:

|              |                   |
| ------------ | ----------------- |
| **Email**    | admin@example.com |
| **Password** | medplum_admin     |

To make sure the server is working, you can access the health check at [http://localhost:8103/healthcheck](http://localhost:8103/healthcheck)

If everything is working, you should see the following in your browser:

```json
{ "ok": true, "version": "<MEDPLUM_VERSION>", "postgres": true, "redis": true }
```

:::warning[Troubleshooting]

If you get an error such as `error: role "medplum" does not exist` or `password authentication failed for user "medplum"` this usually means you have another instance of Postgres running. Closing the other instance should resolve this issue.

:::

### Run the Medplum Web App

Lastly, you can start the Medplum Web App.

From your root `medplum` directory run:

```sh
cd packages/app
npm run dev
```

You can access the app at [http://localhost:3000/](http://localhost:3000/)

The default username is `admin@example.com`, default password `medplum_admin`. After you can sign in, follow [Run Medplum locally with synthetic test patients](./local-dev-sample-data) to create a regular project and import sample patients.
