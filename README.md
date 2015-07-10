# MEO Cloud Player

Minimalistic client-side music player for files on [MEO Cloud](https://meocloud.pt/). Should also be compatible with Dropbox (not tested).

Try it live on https://luisgoncalves.github.io/meocloud-player.

- Associates cloud account on first access 
- Plays random music files (MP3, WAV)
- Music files metadata is stored locally on the browser
	- Updated on each usage (partial updates using the *delta* APIs)
- Uses Local Storage and IndexedDB (may request permissions)
