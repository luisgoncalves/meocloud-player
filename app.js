page('/', index);
//  page.exit('/', function () { $('#index').hide(); });
page('/player', player);
page('/oauth/authorize', oAuthAuthorize);
page('/oauth/error/:error', oAuthError);

var oAuthFlow = new OAuth2ImplicitFlow('https://meocloud.pt/oauth2/authorize', '4722fde2-2f99-4118-9373-3270c572d003', window.location.origin);

$(page.start);

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
    console.log("player");
    var accessToken = oAuthFlow.getToken();
    $.ajax({
        url: 'https://publicapi.meocloud.pt/1/Account/Info',
        headers: { Authorization: 'Bearer ' + accessToken },
        success: function (data) {
            console.log(data);
        }
    });
}

function oAuthAuthorize() {
    var authzRequest = oAuthFlow.prepareAuthzRequest();
    window.location.href = authzRequest;
}

function oAuthError(ctx) {
    console.log("oAuthError: " + ctx.params.error);
}

function OAuth2ImplicitFlow(authzEndpoint, clientId, redirectUri) {
    var self = this;

    self.authzUrlTemplate = new URITemplate(authzEndpoint + '?response_type=token&client_id={client_id}&redirect_uri={redirect_uri}&state={state}');
    self.clientId = clientId;
    self.redirectUri = redirectUri;

    self.storage = window.localStorage;

    self.prepareAuthzRequest = function () {

        // TODO
        var state = '1234567890';
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

    self.setToken = function (token, expires) {

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
}