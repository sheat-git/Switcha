"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NintendoUrl = exports.Nintendo = void 0;
class Nintendo {
}
Nintendo.clientId = '71b963c1b7b6d119';
Nintendo.host = 'accounts.nintendo.com';
exports.Nintendo = Nintendo;
class NintendoUrl {
}
NintendoUrl.authorize = 'https://accounts.nintendo.com/connect/1.0.0/authorize';
NintendoUrl.sessionToken = 'https://accounts.nintendo.com/connect/1.0.0/api/session_token';
NintendoUrl.apiToken = 'https://accounts.nintendo.com/connect/1.0.0/api/token';
NintendoUrl.me = 'https://api.accounts.nintendo.com/2.0.0/users/me';
NintendoUrl.login = 'https://api-lp1.znc.srv.nintendo.net/v3/Account/Login';
exports.NintendoUrl = NintendoUrl;
