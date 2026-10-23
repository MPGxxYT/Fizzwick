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

## Example: nginx

```nginx
server {
    listen 443 ssl;
    server_name fizzwick.example;
    root /srv/fizzwick/dist;

    location = /sw.js { add_header Cache-Control "no-cache"; }
    location = /index.html { add_header Cache-Control "no-cache"; }
    location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }

    location / {
        try_files $uri /index.html;
    }
}
```
