# Deploying Fizzwick

Fizzwick is a static site: `npm run build` writes everything to `dist/`, and the server only has to serve those files (ADR 0002). The service worker that makes it installable and offline needs a few things from the server.

## Server requirements

- **HTTPS.** Browsers only run service workers on HTTPS (or localhost). Over plain HTTP the app still works online, but it can't be installed or used offline.
- **Unknown paths fall back to `index.html`.** Riff links such as `/drinks/cherry-limeade/fizz=soda-water` are routes inside the app, not files. The server must answer any path that isn't a file with `dist/index.html` and status 200.
- **No caching, or a short one, on `/sw.js`.** The browser checks this file to find out about a new version. Serve it with `Cache-Control: no-cache` (or a max-age of a few minutes at most), or updates can take a day or more to reach people.
- **No caching on `/index.html` either.** It names the current bundle, so the same `no-cache` applies.
- **Long caching on `/assets/`.** Files there have a content hash in their names and never change. Serve them with `Cache-Control: public, max-age=31536000, immutable`.
- **The manifest as `application/manifest+json`.** Most servers already map `.webmanifest` to it.

## How updates reach people

Each build writes a new `sw.js` whose version is a hash of every file it precaches. When someone opens the app online, page loads go to the network first, so they get the new `index.html` and bundle straight away; meanwhile the browser installs the new service worker, which replaces the old cache. Offline launches use whatever version was cached last. Nobody has to reinstall.

## How Fizzwick is deployed

Fizzwick runs on the home server as a small `nginx:alpine` container named `fizzwick`, behind Nginx Proxy Manager, which handles HTTPS. The container's nginx config is [`deploy/conf/default.conf`](../deploy/conf/default.conf) and the container is defined in [`deploy/compose.yaml`](../deploy/compose.yaml).

Every push to `main` runs the `CI` workflow. Once the tests pass, the `deploy` job joins the tailnet, copies `deploy/` and the tested build to `~/fizzwick` on the server with rsync, and runs `docker compose up` and an nginx reload. Nginx serves the new files straight away; the container isn't restarted.

On pull requests, `npm run check:server` starts the same nginx image on the CI runner against the build and fails if any rule above isn't met. It needs Docker, so it only runs in CI.

## Setting up the server (once)

1. The container joins `server-stack_servernet`, the Docker network Nginx Proxy Manager is on (set in `deploy/compose.yaml`). If the proxy manager moves to another network, find the new name with `docker inspect nginx-proxy-manager --format '{{json .NetworkSettings.Networks}}'` on the server and update the compose file.
2. In the GitHub repo, under Settings > Secrets and variables > Actions, add the secrets `TAILSCALE_AUTHKEY`, `SERVER_HOST` (the server's Tailscale name or address), `SERVER_USER` and `SSH_PRIVATE_KEY`, the same values main-webserver uses. Tailscale auth keys expire; if a deploy fails at "Connect to Tailscale", make a new reusable, ephemeral key.
3. On the server, check that the SSH user can run `docker compose` without sudo and that `rsync` is installed.
4. Point `fizzwick.mortality.app` at the server in DNS, if a wildcard record doesn't already.
5. In Nginx Proxy Manager, add a Proxy Host:
   - Domain: `fizzwick.mortality.app`. Scheme `http`, forward hostname `fizzwick`, port `80`.
   - Leave **Cache Assets off**. It caches `.js` files at the proxy, `sw.js` included, which delays updates.
   - SSL tab: request a new Let's Encrypt certificate, and turn on Force SSL and HTTP/2.
6. Merge to `main` (or re-run the latest `main` workflow). The proxy host shows "502 Bad Gateway" until the first deploy has started the container.

## Checking a deploy

On a phone, open `https://fizzwick.mortality.app`: install it to the home screen, open a Riff link such as `/drinks/cherry-limeade/fizz=soda-water`, then turn on airplane mode and open the app again.
