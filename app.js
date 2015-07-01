page('/', index);
page('/player', player);
page('/oauth/authorize', oAuthAuthorize);
page('/oauth/error/:error', oAuthError);

var oAuthFlow = new OAuth2ImplicitFlow('https://meocloud.pt/oauth2/authorize', '4722fde2-2f99-4118-9373-3270c572d003', window.location.origin);
var cloudClient = new CloudClient('https://publicapi.meocloud.pt/1');

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

    //$.ajax({
    //    url: 'https://publicapi.meocloud.pt/1/Account/Info',
    //    headers: { Authorization: 'Bearer ' + accessToken },
    //    success: function (data) {
    //        console.log(data);
    //    }
    //});

    cloudClient.loadFiles(accessToken, 'Music', function () {
        cloudClient.getRandomFileUrl(function (fileUrl) {
            $('#player audio').attr('src', fileUrl);
        })
    });
}

function oAuthAuthorize() {
    var authzRequest = oAuthFlow.prepareAuthzRequest();
    window.location.href = authzRequest;
}

function oAuthError(ctx) {
    console.log("oAuthError: " + ctx.params.error);
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