# MEO Cloud Player

Minimalistic client-side music player for files on [MEO Cloud](https://meocloud.pt/). Also compatible with Dropbox.

Try it live on https://luisgoncalves.github.io/meocloud-player/. Confirm that the URL remains over SSL (GitHub pages sometimes [redirects to non-SSL URLs](https://github.com/isaacs/github/issues/289)).

- Associates cloud account on first access 
- Plays random music files (MP3, WAV)
- Music files metadata is stored locally on the browser
	- Updated on each usage (partial updates using the *delta* APIs)
- Uses Local Storage and IndexedDB (may request permissions)

## Disclaimer

This project was developed to improve my Javascript/client-side knowledge and explore some libraries/tools/etc.

- The first version is plain old Javascript with the help of jQuery
- The second version is based on Angular JS