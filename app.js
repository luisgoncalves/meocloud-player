page('/', index);
page('/player', player);
page('/oauth/authorize', oAuthAuthorize);
page('/oauth/error/:error', oAuthError);

var oAuthFlow = new OAuth2ImplicitFlow('https://meocloud.pt/oauth2/authorize', '4722fde2-2f99-4118-9373-3270c572d003', window.location.origin);

$(page.start);

//
// Application actions
//

function index(ctx) {

    // Check if this is an OAuth callback
    var res = null;
    if (ctx.hash) {
        res = URI.parseQuery(ctx.hash);
    } else if (window.location.search) {
        // MEO Cloud has a bug and doesn't return errors on the URL fragment
        res = URI.parseQuery(window.location.search);
    }

    if (res) {
        oAuthFlow.processAuthzResponse(
            res,
            function () { page('/player'); },
            function (err) { page('/oauth/error/' + err); }
        );
        return;
    }

    // Check if there's a valid token
    if (oAuthFlow.getToken()) {
        page('/player');
    } else {
        $('#index').show();
    }
}

function player() {

    var accessToken = oAuthFlow.getToken();
    if (!accessToken) {
        page('/');
    }

    var fileManager = new FileMetadataManager(
        new CloudClient('https://publicapi.meocloud.pt/1', accessToken)
    );

    var getAndPlayRandomFile = function () {
        fileManager.getRandomFileUrl(function (fileUrl) {
            $('#player audio').attr('src', fileUrl);
        })
    };

    $('#player audio').bind('ended', getAndPlayRandomFile);
    $('#next').click(getAndPlayRandomFile);
    $('#refresh').click(function () {
        fileManager.update(function () { });
    });

    $('#player').show();

    fileManager.update(getAndPlayRandomFile);

    //$.ajax({
    //    url: 'https://publicapi.meocloud.pt/1/Account/Info',
    //    headers: { Authorization: 'Bearer ' + accessToken },
    //    success: function (data) {
    //        console.log(data);
    //    }
    //});
}

function oAuthAuthorize() {
    var authzRequest = oAuthFlow.prepareAuthzRequest();
    window.location.href = authzRequest;
}

function oAuthError(ctx) {
    console.log("oAuthError: " + ctx.params.error);
}

//
// Local file metadata manager
//

function FileMetadataManager(cloudClient) {
    var self = this;

    self.cloudClient = cloudClient;
    self.db = null;
    self.count = null;

    self.update = function (done) {
        self.openDb(function () {
            // Get updates since the last known cursor
            console.log('UPDATE STARTED');
            self.cloudClient.delta(
                window.localStorage.getItem('cloud_last_cursor'),
                self.deltaProcessor(done)
            );
        });
    }

    self.deltaProcessor = function (done) {
        return function (updatedItems, deletedPaths, cursor, isCompleted) {

            var transaction = self.db.transaction(FilesStoreName, 'readwrite');
            // DB requests will be triggered on this transaction. When it completes, all the requests have succeeded.
            transaction.oncomplete = function () {
                // Store the last known cursor (this helps when something fails in large deltas)
                window.localStorage.setItem('cloud_last_cursor', cursor);
                // If this was the last delta, get an updated file count and invoke the callback
                if (isCompleted) {
                    self.db
                        .transaction(FilesStoreName)
                        .objectStore(FilesStoreName)
                        .count()
                        .onsuccess = function (event) {
                            self.count = event.target.result;
                            console.info('UPDATE COMPLETED');
                            done();
                        };
                }
            };
            var fileStore = transaction.objectStore(FilesStoreName);

            if (deletedPaths.length > 0) {
                self.purgefiles(deletedPaths, fileStore);
            }

            updatedItems.forEach(function (item) {
                if (item.is_dir) {
                    self.removeFileIfExists(item, fileStore);
                } else {
                    self.addFile(item, fileStore);
                }
            });
        };
    }

    self.purgefiles = function (deletedPaths, fileStore) {
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
    }

    self.removeFileIfExists = function (item, fileStore) {
        fileStore
            .get(item.path)
            .onsuccess = function (event) {
                // Was indeed a file. Remove it.
                if (event.target.result) {
                    fileStore
                        .delete(item.path)
                        .onsuccess = function () { console.info('REMOVE %s', item.path) };
                }
            };
    }

    self.addFile = function (item, fileStore) {
        if (item.mime_type.startsWith('audio/mpeg') || item.mime_type == 'audio/wav' || item.path.endsWith('.mp3')) {
            fileStore
                .put({ path: item.path, url: null, expires: null })
                .onsuccess = function () { console.info('ADD %s', item.path); };
        } else {
            console.log('IGNORE %s due to mime-type %s', item.path, item.mime_type);
        }
    }

    self.getRandomFileUrl = function (done) {
        
        self.getRandomFile(function (file) {
            if (file.url && file.expires > Date.now()) {
                done(file.url);
                return;
            }
            
            self.cloudClient.getFileUrl(
                file.path,
                function (data) {
                    // TODO update file.url and file.expires
                    file.url = data.url;
                    file.expires = new Date(data.expires);
                    done(file.url);
                });
        });
    }

    self.getRandomFile = function(done){
        var cnt = Math.floor(Math.random() * self.count);
        self.db
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
    }

    const FilesStoreName = 'files';

    self.openDb = function (done) {
        if (self.db != null) {
            done();
            return;
        }

        var request = window.indexedDB.open("Player", 1);
        request.onsuccess = function (event) {
            // Store the db object
            self.db = event.target.result;
            // Generic error handler
            self.db.onerror = function (errorEvent) {
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
    }
}

//
// OAuth 2.0 implicit flow logic
//

function OAuth2ImplicitFlow(authzEndpoint, clientId, redirectUri) {
    var self = this;

    self.authzUrlTemplate = new URITemplate(authzEndpoint + '?response_type=token&client_id={client_id}&redirect_uri={redirect_uri}&state={state}');
    self.clientId = clientId;
    self.redirectUri = redirectUri;

    self.storage = window.localStorage;

    self.prepareAuthzRequest = function () {

        var state = self.generateState();
        self.storage.setItem('oauth_state', state);

        var authzRequest = self.authzUrlTemplate.expand({
            client_id: self.clientId,
            redirect_uri: self.redirectUri,
            state: state
        });
        return authzRequest;
    }

    self.processAuthzResponse = function (res, success, error) {

        if (!res.state) {
            error('invalid response');
            return;
        }

        // Check state

        var state = self.storage.getItem('oauth_state');
        self.storage.removeItem('oauth_state');
        if (!state || state !== res.state) {
            error('missing or invalid state');
            return;
        }

        if (res.error) {
            error(res.error);
            return;
        }

        // Store token and expiration

        if (!res.access_token || !res.expires_in) {
            error('invalid response');
            return;
        }

        self.storage.setItem('oauth_token', res.access_token);
        self.storage.setItem('oauth_expires', Date.now() + res.expires_in * 1000);

        success();
    }

    self.getToken = function () {
        var expires = self.storage.getItem('oauth_expires');
        var token = self.storage.getItem('oauth_token');

        if (!expires || !token) {
            return null;
        }

        if (Number(expires) < Date.now()) {
            return null;
        }

        return token;
    }

    self.generateState = function () {
        var state = new Uint8Array(128 / 8);
        window.crypto.getRandomValues(state);
        return btoa(state)
            // From https://github.com/RGBboy/urlsafe-base64
            .replace(/\+/g, '-') // Convert '+' to '-'
            .replace(/\//g, '_') // Convert '/' to '_'
            .replace(/=+$/, ''); // Remove ending '='
    }
}

//
// Cloud client
//

function CloudClient(apiBaseAddress, accessToken) {
    var self = this;

    self.deltaUrl = apiBaseAddress + '/Delta';
    self.mediaUrlTemplate = new URITemplate(apiBaseAddress + '/Media/meocloud/{+path}');
    self.headers = { Authorization: 'Bearer ' + accessToken };

    // Checks for incoming changes since a given reference cursor.
    self.delta = function (
        cursor, // The reference cursor. Can be null, which will fetch everything
        callback // Callback for deltas
    ) {
        console.log('DELTA %s', cursor);
        $.ajax({
            url: self.deltaUrl,
            method: 'POST',
            headers: self.headers,
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
                    self.delta(data.cursor, callback);
                }
            }
        });
    }

    self.getFileUrl = function (filePath, done) {
        $.ajax({
            url: self.mediaUrlTemplate.expand({ path: filePath }),
            method: 'POST',
            headers: self.headers,
            success: done
        });
    }
}