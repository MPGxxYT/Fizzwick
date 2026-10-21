# The Drink file format is the sharing format

House Drinks are JSON files in the repo, and Custom Drinks will later be shared as files or encoded strings. We decided both use the same Drink format from v1, so a House Drink and a shared Custom Drink are the same kind of file and the importer has one format to read. The cost is that the v1 format becomes a public contract: once people share files, changing the format means versioning it and keeping old files importable.

## Consequences

- Drinks and Options get permanent IDs from the first commit, because Favorites, Riff links, and future imports refer to them.
- Options are retired, never removed, so existing Favorites and shared files keep working.
- The format carries a version number from v1, even though only one version exists.
