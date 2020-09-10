# MEO Cloud Player

**NOTE**: this project hasn't been maintained for a while. It uses old versions of frameworks/libraries which may contain security issues.

Minimalistic client-side music player for files on [MEO Cloud](https://meocloud.pt/).

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
1. Browse to http://localhost:4200

## Disclaimer

This project was developed to improve my Javascript/client-side knowledge and explore some libraries/tools/etc.

- The first version is plain old Javascript with the help of jQuery
- The second version is based on Angular JS
- The third version (current) is based on Angular and ngrx
