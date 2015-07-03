page('/', index);
page('/player', player);
page('/oauth/authorize', oAuthAuthorize);
page('/oauth/error/:error', oAuthError);

var oAuthFlow = new OAuth2ImplicitFlow('https://meocloud.pt/oauth2/authorize', '4722fde2-2f99-4118-9373-3270c572d003', window.location.origin);
//var cloudClient = new CloudClient('https://publicapi.meocloud.pt/1');

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

    $('#player').show();

    var accessToken = oAuthFlow.getToken();
    if (!accessToken) {
        page('/');
    }

    var fileManager = new FileMetadataManager(
        new CloudClient_V2('https://publicapi.meocloud.pt/1', accessToken)
    );

    var getRandomFileAndSetPlayer = function () {
        fileManager.getRandomFileUrl(function (fileUrl) {
            $('#player audio').attr('src', fileUrl);
        })
    };

    fileManager.update('Music', getRandomFileAndSetPlayer);
    $('#player button').click(getRandomFileAndSetPlayer);

    //$.ajax({
    //    url: 'https://publicapi.meocloud.pt/1/Account/Info',
    //    headers: { Authorization: 'Bearer ' + accessToken },
    //    success: function (data) {
    //        console.log(data);
    //    }
    //});

    //cloudClient.loadFiles(accessToken, 'Music', function () {
    //    cloudClient.getRandomFileUrl(function (fileUrl) {
    //        $('#player audio').attr('src', fileUrl);
    //    })
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
    self.files = [];

    self.update = function (startPath, done) {
        var cursor = null;
        self.cloudClient.delta(
            cursor,
            self.processPathUpdate,
            self.purgePath,
            function () { return self.files.length < 200 },
            function (finalCursor) { done(); }
        );
    }

    self.processPathUpdate = function (item) {
        if (item.is_dir) {
            console.log('DIR %s', item.path);
        } else {
            self.addFile(item);
        }
    }

    self.addFile = function (file) {
        if (file.mime_type.startsWith('audio/mpeg') || file.mime_type == 'audio/wav' || file.path.endsWith('.mp3')) {
            console.log('ADD %s', file.path);
            self.files.push({ path: file.path, url: null, expires: null });
        } else {
            console.log('IGNORE %s due to mime-type %s', file.path, file.mime_type);
        }
    }

    self.purgePath = function (path) {
        console.log('PURGE %s', path);
    }

    self.getRandomFileUrl = function (done) {
        var idx = Math.floor(Math.random() * self.files.length);
        var file = self.files[idx];

        if (file.url && file.expires > Date.now()) {
            done(file.url);
            return;
        }

        self.cloudClient.getFileUrl(
            file.path,
            function (data) {
                file.url = data.url;
                file.expires = new Date(data.expires);
                done(file.url);
            });
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

function CloudClient_V2(apiBaseAddress, accessToken) {
    var self = this;

    self.deltaUrl = apiBaseAddress + '/Delta';
    self.mediaUrlTemplate = new URITemplate(apiBaseAddress + '/Media/meocloud/{+path}');
    self.headers = { Authorization: 'Bearer ' + accessToken };

    // Checks for incoming changes since a given reference cursor.
    self.delta = function (
        cursor, // The reference cursor. Can be null, which will fetch everything
        onPathUpdated, // Callback invoked for every delta of existing files/dirs (created or updated)
        onPathRemoved, // Callback for deltas of removed paths
        shouldProceed, // Callback to determine if more deltas should be processed
        done // Final callback when there aren't more changes to process
    ) {
        console.log('= DELTA %s', cursor);
        $.ajax({
            url: self.deltaUrl,
            method: 'POST',
            headers: self.headers,
            data: { cursor: cursor },
            success: function (data) {

                data.entries.forEach(function (delta) {
                    // delta => [path, metadata]
                    if (delta[1] != null) {
                        onPathUpdated(delta[1])
                    } else {
                        onPathRemoved(delta[0]);
                    }
                });

                if (data.has_more && shouldProceed()) {
                    self.delta(data.cursor, onPathUpdated, onPathRemoved, shouldProceed, done);
                } else {
                    done(data.cursor);
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

function CloudClient(apiBaseAddress) {
    var self = this;

    self.metadataUrlTemplate = new URITemplate(apiBaseAddress + '/Metadata/meocloud/{+path}?list=true');
    self.mediaUrlTemplate = new URITemplate(apiBaseAddress + '/Media/meocloud/{+path}');
    self.headers = {};

    self.files = [];

    self.loadFiles = function (accessToken, startPath, done) {

        // startPath must be a folder

        self.headers = { Authorization: 'Bearer ' + accessToken };
        self.loadFilesInternal([startPath], done, 10)
    }

    self.loadFilesInternal = function (dirList, done, limit) {

        if (dirList.length == 0 || self.files.length > limit) {
            console.log('DONE');
            done();
            return;
        }

        // Directories are transversed in depth-first

        var dirPath = dirList.pop();
        console.log('DIR %s', dirPath);

        $.ajax({
            url: self.metadataUrlTemplate.expand({ path: dirPath }),
            headers: self.headers,
            success: function (dir) {
                console.log('HASH %s - %s', dir.hash, dir.path);
                // Directories are added for processing; files are stored.
                dir.contents.forEach(function (item) {
                    if (item.is_dir) {
                        dirList.push(item.path);
                    } else {
                        self.addFile(item);
                    }
                });

                self.loadFilesInternal(dirList, done, limit);
            }
        });
    }

    self.addFile = function (file) {
        if (file.mime_type.startsWith('audio/mpeg') || file.mime_type == 'audio/wav') {
            console.log('ADD %s', file.path);
            self.files.push(file.path);
        } else {
            console.log('IGNORE %s due to mime-type %s', file.path, file.mime_type);
        }
    }

    self.getRandomFileUrl = function (done) {
        var idx = Math.floor(Math.random() * self.files.length);
        var filePath = self.files[idx];
        $.ajax({
            url: self.mediaUrlTemplate.expand({ path: filePath }),
            method: 'POST',
            headers: self.headers,
            success: function (file) {
                done(file.url);
            }
        });
    }
}