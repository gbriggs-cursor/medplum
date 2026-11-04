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

All the containers present are configured to work together out of the box with no configuration. Just run the commands above and go to http://localhost:3000 to get started with your own full-stack local instance of Medplum!

| Service | URL |
| --- | --- |
| App | [http://localhost:3000/](http://localhost:3000/) |
| API | [http://localhost:8103/](http://localhost:8103/) |
| Healthcheck | [http://localhost:8103/healthcheck](http://localhost:8103/healthcheck) |

First-boot seed creates a Super Admin user so you can sign in. It does not create test patients.

|              |                   |
| ------------ | ----------------- |
| **Email**    | admin@example.com |
| **Password** | medplum_admin     |

Register a regular project at [http://localhost:3000/register](http://localhost:3000/register), then import synthetic data at [http://localhost:3000/batch](http://localhost:3000/batch). Step-by-step: [Local development with sample patients](/docs/contributing/local-sample-patients).

When you call the API or SDK from another process, set `baseUrl` to `http://localhost:8103/` (not `https://api.medplum.com`). The app image already uses that API URL.

:::info[]

Starting the whole stack can take a few minutes. This is due to the initial one-time setup Medplum server has to do before it is able to pass its healthcheck. Wait until `/healthcheck` returns `"ok": true` before signing in.

:::
