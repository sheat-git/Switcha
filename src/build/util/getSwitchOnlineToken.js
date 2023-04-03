"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSwitchOnlineServiceWithInteraction = exports.getSwitchOnlineService = exports.getSwitchOnlineTokenWithInteraction = exports.getSwitchOnlineToken = void 0;
const axios_1 = __importDefault(require("axios"));
const SwitchOnlineService_1 = require("../service/SwitchOnlineService");
const SessionTokenStore_1 = require("../store/SessionTokenStore");
const SwitchOnlineTokenStore_1 = require("../store/SwitchOnlineTokenStore");
const const_1 = require("./const");
const getApiToken = async (sessionToken) => {
    const res = await axios_1.default.post(const_1.NintendoUrl.apiToken, {
        'client_id': const_1.Nintendo.clientId,
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer-session-token',
        'session_token': sessionToken,
    });
    return {
        id: res.data['id_token'],
        access: res.data['access_token']
    };
};
const getUserInfo = async (accessToken) => {
    const res = await axios_1.default.get(const_1.NintendoUrl.me, {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    });
    return {
        language: res.data['language'],
        country: res.data['country'],
        birthday: res.data['birthday']
    };
};
const getF = async (idToken) => {
    const res = await axios_1.default.post('https://api.imink.app/f', {
        "token": idToken,
        "hash_method": 1
    });
    return {
        f: res.data['f'],
        timestamp: res.data['timestamp'].toString(),
        requestId: res.data['request_id']
    };
};
const getToken = async (params) => {
    const res = await axios_1.default.post(const_1.NintendoUrl.login, {
        'parameter': {
            'naIdToken': params.idToken,
            'timestamp': params.timestamp,
            'requestId': params.requestId,
            'language': params.userInfo.language,
            'naCountry': params.userInfo.country,
            'naBirthday': params.userInfo.birthday,
            'f': params.f
        }
    }, {
        headers: {
            'X-ProductVersion': '2.5.0',
            'X-Platform': 'Android'
        }
    });
    const credential = res.data['result']['webApiServerCredential'];
    return {
        token: credential['accessToken'],
        expiresIn: credential['expiresIn']
    };
};
const getSwitchOnlineToken = async (discordId) => {
    const storedToken = await SwitchOnlineTokenStore_1.SwitchOnlineTokenStore.shared.get(discordId);
    if (storedToken) {
        return storedToken;
    }
    const sessionToken = await SessionTokenStore_1.SessionTokenStore.shared.get(discordId);
    if (!sessionToken) {
        return null;
    }
    const apiToken = await getApiToken(sessionToken);
    const [userInfo, f] = await Promise.all([
        getUserInfo(apiToken.access),
        getF(apiToken.id)
    ]);
    const data = await getToken({
        idToken: apiToken.id,
        userInfo,
        ...f
    });
    await SwitchOnlineTokenStore_1.SwitchOnlineTokenStore.shared.put(discordId, data.token, data.expiresIn - 10);
    return data.token;
};
exports.getSwitchOnlineToken = getSwitchOnlineToken;
const getSwitchOnlineTokenWithInteraction = async (client, interaction, ephemeral) => {
    const discordId = interaction.member?.user.id ?? interaction.user.id;
    const storedToken = await SwitchOnlineTokenStore_1.SwitchOnlineTokenStore.shared.get(discordId);
    if (storedToken) {
        await client.deferReply(interaction, ephemeral);
        return storedToken;
    }
    const sessionToken = await SessionTokenStore_1.SessionTokenStore.shared.get(discordId);
    if (!sessionToken) {
        await client.sendReply(interaction, {
            content: (() => {
                switch (interaction.locale) {
                    case 'ja':
                        return 'この操作にはログインが必要です。ログインは「/ろぐいん」コマンドで可能です。';
                    default:
                        return 'This operation requires login. You can log in with the "/login" command.';
                }
            })()
        }, true);
        return null;
    }
    const [_, res] = await Promise.allSettled([
        client.deferReply(interaction, ephemeral),
        (async () => {
            const apiToken = await getApiToken(sessionToken);
            const [userInfo, f] = await Promise.all([
                getUserInfo(apiToken.access),
                getF(apiToken.id)
            ]);
            return await getToken({
                idToken: apiToken.id,
                userInfo,
                ...f
            });
        })()
    ]);
    if (res.status === 'fulfilled') {
        await SwitchOnlineTokenStore_1.SwitchOnlineTokenStore.shared.put(discordId, res.value.token, res.value.expiresIn - 10);
        return res.value.token;
    }
    else {
        await client.sendFollowup(interaction, {
            content: (() => {
                switch (interaction.locale) {
                    case 'ja':
                        return '何らかのエラーが発生しました。時間をおいて再度お試しください。';
                    default:
                        return 'Some error occurred. Please try again in a few minutes.';
                }
            })()
        }, ephemeral);
        return null;
    }
};
exports.getSwitchOnlineTokenWithInteraction = getSwitchOnlineTokenWithInteraction;
const getSwitchOnlineService = async (discordId) => {
    const token = await (0, exports.getSwitchOnlineToken)(discordId);
    return token ? new SwitchOnlineService_1.SwitchOnlineService(token) : null;
};
exports.getSwitchOnlineService = getSwitchOnlineService;
const getSwitchOnlineServiceWithInteraction = async (client, interaction, ephemeral) => {
    const token = await (0, exports.getSwitchOnlineTokenWithInteraction)(client, interaction, ephemeral);
    return token ? new SwitchOnlineService_1.SwitchOnlineService(token) : null;
};
exports.getSwitchOnlineServiceWithInteraction = getSwitchOnlineServiceWithInteraction;
