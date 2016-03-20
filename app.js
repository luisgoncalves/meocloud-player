//
// Application actions
//

var app = function () {

    var meocloudConfig = {
        authzEndpoint: 'https://meocloud.pt/oauth2/authorize',
        apiBaseAddress: 'https://publicapi.meocloud.pt/1',
        root: 'meocloud',
        clientIds: {
            dev: '4722fde2-2f99-4118-9373-3270c572d003',
            pub: '6abdf380-083a-453a-9e36-1b1528ab8255'
        },
        name: 'meocloud',
        shouldReadTags: false
    };

    var dropboxConfig = {
        authzEndpoint: 'https://www.dropbox.com/1/oauth2/authorize',
        apiBaseAddress: 'https://api.dropboxapi.com/1',
        adjustApiPath: function (p) { return p.toLowerCase(); },
        root: 'auto',
        clientIds: {
            dev: '2uj0app9uetkerk',
            pub: 'TODO'
        },
        name: 'dropbox',
        shouldReadTags: true
    };

    var cloud = function (config) {
        var clientId = window.location.hostname == 'localhost' ? config.clientIds.dev : config.clientIds.pub;
        return {
            oauth: oAuth2ImplicitFlow(config.authzEndpoint, clientId, window.location.origin + window.location.pathname, config.name),
            getFileManager: function (accessToken) {
                return fileMetadataManager(cloudClient(config.apiBaseAddress, config.root, config.adjustApiPath || function (p) { return p; }, accessToken), config.name, config.shouldReadTags);
            }
        };
    };

    var clouds = {
        meocloud: cloud(meocloudConfig),
        dropbox: cloud(dropboxConfig),
    };

    var activeCloud = clouds.meocloud;
    //var activeCloud = clouds.dropbox;

    var index = function () {

        // MEO Cloud has a bug and doesn't return errors on the URL fragment
        // Assume this is a bogus OAuth callback
        var url = new URI(window.location.href);
        if (url.query()) {
            url.hash(url.query());
            url.query('');
            window.location.href = url.toString();
            return;
        }

        if (activeCloud.oauth.getToken()) {
            page('/player');
        } else {
            $('#index').show();
        }
    };

    var oAuthAuthorize = function () {
        var authzRequest = activeCloud.oauth.prepareAuthzRequest();
        window.location.href = authzRequest;
    };

    var oAuthCallback = function (ctx) {
        activeCloud.oauth.processAuthzResponse(
            URI.parseQuery(ctx.params.res),
            function () { page('/player'); },
            function (err) { page('/oauth/error/' + err); }
        );
    };

    var oAuthError = function (ctx) {
        console.warn("oAuthError: " + ctx.params.error);
        $('#index').show();
        $('#error').show();
    };

    var player = function () {

        var accessToken = activeCloud.oauth.getToken();
        if (!accessToken) {
            page('/');
            return;
        }

        var fileManager = activeCloud.getFileManager(accessToken);

        var getAndPlayRandomFile = function () {
            $('#delete').prop('disabled', true);
            fileManager.getRandomFileUrl(
                function (fileUrl) {
                    $('#player audio').attr('src', fileUrl);
                    $('#delete').prop('disabled', false);
                },
                function (tags) {
                    $('#artist').text(tags.artist || 'N/A');
                    $('#title').text(tags.title || 'N/A');
                    $('#album').text(tags.album || 'N/A');
                    $('#year').text(tags.year ? ' (' + tags.year + ')' : '');
                    //console.log(tags);
                }
            );
        };

        $('#player audio').bind('ended', getAndPlayRandomFile);
        $('#next').click(getAndPlayRandomFile);
        $('#delete').click(function () {
            if (window.confirm('Delete the current file?')) {
                $('#delete').prop('disabled', true);
                fileManager.deleteCurrentFile(getAndPlayRandomFile);
            }
        });

        $('#player').show();

        fileManager.update(getAndPlayRandomFile);
    };

    // Routes
    page.base(window.location.pathname.slice(0, -1));
    page('/', index);
    page('/player', player);
    page('/oauth/authorize', oAuthAuthorize);
    page('/oauth/error/:error', oAuthError);
    page('/#:res', oAuthCallback);

    return {
        start: function () {
            page.start({
                dispatch: true,
                hashbang: true
            });
        }
    };

}();

$(app.start);

//
// Local file metadata manager
//

function fileMetadataManager(cloudClient, cloudName, shouldReadTags) {

    var currentFile = null;
    var count = 0;
    var db = null;
    const LastCursorKey = cloudName + '_last_cursor';
    const FilesStoreName = 'files';

    // Database

    var openDb = function (done) {
        if (db != null) {
            done();
            return;
        }

        var request = window.indexedDB.open(cloudName, 1);
        request.onsuccess = function (event) {
            // Store the db object
            db = event.target.result;
            // Generic error handler
            db.onerror = function (errorEvent) {
                console.error("Database error: " + errorEvent.target.errorCode);
            };
            done();
        };
        request.onupgradeneeded = function (event) {
            // This is invoked before the 'onsuccess' event, if any changes are needed
            var db = event.target.result;
            console.log('Creating files object store');
            db.createObjectStore(FilesStoreName, { keyPath: "path" });
        }
    };

    var addFile = function (item, fileStore) {
        if (item.mime_type.startsWith('audio/mpeg') || item.mime_type == 'audio/wav' || item.path.endsWith('.mp3')) {
            fileStore
                .put({ path: item.path, tags: null })
                .onsuccess = function () { console.info('ADD %s', item.path); };
        } else {
            console.log('IGNORE %s due to mime-type %s', item.path, item.mime_type);
        }
    };

    var removeFileIfExists = function (item, fileStore) {
        fileStore
            .get(item.path)
            .onsuccess = function (event) {
                // Was indeed a file. Remove it.
                if (event.target.result) {
                    fileStore
                        .delete(item.path)
                        .onsuccess = function () { console.info('REMOVE %s', item.path); };
                }
            };
    };

    var purgefiles = function (deletedPaths, fileStore) {
        console.log('Paths were deleted:');
        console.log(deletedPaths);

        // Iterate the existing files and remove the deleted paths and all their children
        fileStore.openCursor().onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                // Check if the current file is a child of the deleted paths (or one of them)
                if (deletedPaths.some(function (v) { return cursor.key.startsWith(v); })) {
                    cursor.delete().onsuccess = function () {
                        console.info('REMOVE %s', cursor.key);
                        cursor.continue();
                    };
                } else {
                    cursor.continue();
                }
            }
        };
    };

    var getRandomFile = function (done) {

        if (count === 0) {
            return;
        }

        var cnt = Math.floor(Math.random() * count);
        db
        .transaction(FilesStoreName)
        .objectStore(FilesStoreName)
        .openCursor()
        .onsuccess = function (event) {
            var cursor = event.target.result;
            if (cnt > 0) {
                cursor.advance(cnt);
                cnt = -1;
            } else {
                done(cursor.value);
            }
        };
    };

    var readTags = function (item, url, done) {

        if (item.tags) {
            done(item.tags);
            return;
        }

        jsmediatags.read(url, {
            onSuccess: function (res) {

                tags = {
                    artist: res.tags.artist,
                    title: res.tags.title,
                    album: res.tags.album,
                    year: res.tags.year
                };
                done(tags);

                // Store tags on DB if artist or title are known
                if (tags.artist || tags.title) {
                    item.tags = tags;
                    db
                    .transaction(FilesStoreName, 'readwrite')
                    .objectStore(FilesStoreName)
                    .put(item)
                    .onsuccess = function () { console.debug('Updated tags for %s', item.path); };
                }
            },
            onError: function (error) {
                console.warn('Cannot read tags for %s', item.path);
                console.warn(error);
                done({});
            }
        });
    };

    // Process updates from the cloud service (in batches)

    var deltaProcessor = function (done) {
        return function (updatedItems, deletedPaths, cursor, isCompleted) {

            var transaction = db.transaction(FilesStoreName, 'readwrite');
            // DB requests will be triggered on this transaction. When it completes, all the requests have succeeded.
            transaction.oncomplete = function () {
                // Store the last known cursor (this helps when something fails in large deltas)
                window.localStorage.setItem(LastCursorKey, cursor);
                // If this was the last delta, get an updated file count and invoke the callback
                if (isCompleted) {
                    db
                    .transaction(FilesStoreName)
                    .objectStore(FilesStoreName)
                    .count()
                    .onsuccess = function (event) {
                        count = event.target.result;
                        console.info('UPDATE COMPLETED');
                        done();
                    };
                }
            };

            var fileStore = transaction.objectStore(FilesStoreName);

            if (deletedPaths.length > 0) {
                purgefiles(deletedPaths, fileStore);
            }

            updatedItems.forEach(function (item) {
                if (item.is_dir) {
                    removeFileIfExists(item, fileStore);
                } else {
                    addFile(item, fileStore);
                }
            });
        };
    }

    // Public API

    var update = function (done) {
        openDb(function () {
            // Get updates since the last known cursor
            console.log('UPDATE STARTED');
            cloudClient.delta(
                window.localStorage.getItem(LastCursorKey),
                deltaProcessor(done)
            );
        });
    };

    return {
        update: update,
        getRandomFileUrl: function (fileDone, tagsDone) {
            getRandomFile(function (file) {
                currentFile = file;

                cloudClient.getFileUrl(
                    file.path,
                    function (data) {
                        fileDone(data.url);

                        if (shouldReadTags) {
                            readTags(file, data.url, tagsDone);
                        }
                    });
            });
        },
        deleteCurrentFile: function (done) {
            cloudClient.deleteFile(currentFile.path, function () {
                update(function () {
                    currentFile = null;
                    done();
                });
            });
        }
    };
};

//
// OAuth 2.0 implicit flow logic
//

function oAuth2ImplicitFlow(authzEndpoint, clientId, redirectUri, storagePrefix) {

    var storage = window.localStorage;
    const StateKey = 'oauth_state';
    const TokenKey = storagePrefix + '_oauth_token';
    const ExpiresKey = storagePrefix + '_oauth_expires';

    var authzUrlTemplate = new URITemplate(authzEndpoint + '?response_type=token&client_id={client_id}&redirect_uri={redirect_uri}&state={state}');

    var generateState = function () {
        var state = new Uint8Array(128 / 8);
        window.crypto.getRandomValues(state);
        return btoa(state)
            // From https://github.com/RGBboy/urlsafe-base64
            .replace(/\+/g, '-') // Convert '+' to '-'
            .replace(/\//g, '_') // Convert '/' to '_'
            .replace(/=+$/, ''); // Remove ending '='
    };

    return {
        prepareAuthzRequest: function () {
            var state = generateState();
            storage.setItem(StateKey, state);

            var authzRequest = authzUrlTemplate.expand({
                client_id: clientId,
                redirect_uri: redirectUri,
                state: state
            });
            return authzRequest;
        },

        processAuthzResponse: function (res, success, error) {
            if (!res.state) {
                error('invalid response');
                return;
            }

            // Check state

            var state = storage.getItem(StateKey);
            storage.removeItem(StateKey);
            if (!state || state !== res.state) {
                error('missing or invalid state');
                return;
            }

            if (res.error) {
                error(res.error);
                return;
            }

            // Store token and expiration

            if (!res.access_token) {
                error('invalid response');
                return;
            }

            storage.setItem(TokenKey, res.access_token);

            if (res.expires_in) {
                storage.setItem(ExpiresKey, Date.now() + res.expires_in * 1000);
            }

            success();
        },

        getToken: function () {
            var token = storage.getItem(TokenKey);
            if (!token) {
                return null;
            }

            var expires = storage.getItem(ExpiresKey);
            if (expires && Number(expires) < Date.now()) {
                return null;
            }

            return token;
        }
    };
};

//
// Cloud client (Dropbox compliant)
//

function cloudClient(apiBaseAddress, root, adjustApiPath, accessToken) {

    var deltaUrl = apiBaseAddress + adjustApiPath('/Delta');
    var mediaUrlTemplate = new URITemplate(apiBaseAddress + adjustApiPath('/Media/') + root + '{+path}');
    var deleteFileUrl = apiBaseAddress + adjustApiPath('/Fileops/Delete');
    var headers = { Authorization: 'Bearer ' + accessToken };

    // Checks for incoming changes since a given reference cursor.
    var delta = function (
            cursor, // The reference cursor. Can be null, which will fetch everything
            callback // Callback for deltas
        ) {
        console.log('DELTA %s', cursor);
        $.ajax({
            url: deltaUrl,
            method: 'POST',
            headers: headers,
            dataType: 'json',
            jsonp: false,
            data: { cursor: cursor },
            success: function (data) {

                var updatedItems = [];
                var deletedPaths = [];
                data.entries.forEach(function (delta) {
                    // delta => [path, metadata]
                    var item = delta[1];
                    if (item != null) {
                        item.path = delta[0]; // Easier for later comparisons (casing is diferent on 'path' and on 'metadata.path')
                        updatedItems.push(delta[1]);
                    } else {
                        deletedPaths.push(delta[0]);
                    }
                });

                callback(updatedItems, deletedPaths, data.cursor, !data.has_more);

                if (data.has_more) {
                    delta(data.cursor, callback);
                }
            },
            error: function (xhr, status, error) {
                console.error(status);
                console.error(error);
            }
        });
    };

    return {
        delta: delta,

        getFileUrl: function (filePath, done) {
            $.ajax({
                url: mediaUrlTemplate.expand({ path: filePath }),
                method: 'POST',
                headers: headers,
                dataType: 'json',
                success: done,
                error: function (xhr, status, error) {
                    console.error(status);
                    console.error(error);
                }
            });
        },

        deleteFile: function (filePath, done) {
            $.ajax({
                url: deleteFileUrl,
                method: 'POST',
                headers: headers,
                data: { path: filePath, root: root },
                success: done
            });
        }
    };
};