# Local-first, with no server in v1

Fizzwick v1 is a static PWA with no backend: House Drinks ship in the build, Favorites stay on the device, and a Riff is shared as a link that encodes its Drink and Options. We picked this over syncing through an API on the home server because sync needs accounts and auth, and the app has to work offline anyway. Sharing Drinks as files comes next and stays serverless; a hosted database may come later, and it would sit alongside device storage rather than replace it.

## Consequences

- Favorites don't follow a user between devices. Riff links and, later, share files are how a Riff moves from one phone to another.
- Clearing the browser's site data deletes Favorites, since the device holds the only copy.
