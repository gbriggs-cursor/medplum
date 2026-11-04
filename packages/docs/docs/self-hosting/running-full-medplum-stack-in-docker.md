# Running the Full Medplum Stack in Docker

Medplum provides a Docker Compose file which comes with everything you need to get started in just two commands:

```bash
curl https://raw.githubusercontent.com/medplum/medplum/refs/heads/main/docker-compose.full-stack.yml > docker-compose.yml
docker compose up -d
```

The Docker Compose file includes the following containers:

- [redis](https://hub.docker.com/_/redis)
- [postgres](https://hub.docker.com/_/postgres)
- [medplum/medplum-server](https://hub.docker.com/r/medplum/medplum-server)
- [medplum/medplum-app](https://hub.docker.com/r/medplum/medplum-app)

All the containers present are configured to work together out of the box with no configuration.

| Service | URL |
| ------- | --- |
| App | [http://localhost:3000](http://localhost:3000) |
| API | [http://localhost:8103](http://localhost:8103) |
| Health check | [http://localhost:8103/healthcheck](http://localhost:8103/healthcheck) |

Wait until the health check returns `{"ok":true,...}` before signing in. First boot seeds structure definitions and can take several minutes.

Then sign in with the seeded Super Admin account:

| | |
| --- | --- |
| **Email** | `admin@example.com` |
| **Password** | `medplum_admin` |

That account is created on first start when `defaultSuperAdminEmail` / `defaultSuperAdminPassword` are unset. It lands in the Super Admin project, which has no sample patients. To create a regular project, issue a local client, and load synthetic patients, see [Run Medplum locally with synthetic test patients](/docs/contributing/local-dev-sample-data).

Point any SDK or bot at `http://localhost:8103/` (`baseUrl`). Using the hosted API URL with a locally created client returns `Invalid client`.

The compose file sets `MEDPLUM_MAX_JSON_SIZE=1mb`. Raise that value if you import Synthea-sized bundles. See the [sample-data how-to](/docs/contributing/local-dev-sample-data#larger-synthea-populations).

:::info[]

Starting the whole stack can take a few minutes. This is due to the initial one-time setup Medplum server has to do before it is able to pass its healthcheck.

:::
