# MEO Cloud Player

Minimalistic client-side music player for files on [MEO Cloud](https://meocloud.pt/). Also compatible with Dropbox.

Try it live on https://luisgoncalves.github.io/meocloud-player/. Confirm that the URL remains over SSL (GitHub pages sometimes [redirects to non-SSL URLs](https://github.com/isaacs/github/issues/289)).

- Associates cloud account on first access 
- Plays random music files (MP3, WAV)
- Music files metadata is stored locally on the browser
	- Updated on each usage (partial updates using the *delta* APIs)
- Uses Local Storage and IndexedDB (may request permissions)

## Run locally

You'll need Git and node/npm.

1. `git clone git@github.com:luisgoncalves/meocloud-player.git`
1. `cd meocloud-player`
1. `npm install`
1. `npm start`
1. Browse to http://127.0.0.1:8080

You can try the player with dropbox by changing the configuration on `app/scripts/app.js`.

## Disclaimer

This project was developed to improve my Javascript/client-side knowledge and explore some libraries/tools/etc.

- The first version is plain old Javascript with the help of jQuery
- The second version is based on Angular JS