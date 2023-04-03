"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHandlers = exports.loginCommand = void 0;
const v10_1 = require("discord-api-types/v10");
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const SessionTokenStore_1 = require("../store/SessionTokenStore");
const const_1 = require("../util/const");
const color = 0xE60012;
const generateRandom = (size) => {
    return crypto_1.default.randomBytes(size).toString('base64url');
};
const calcurateChallenge = (codeVerifier) => {
    const hash = crypto_1.default.createHash('sha256');
    hash.update(codeVerifier);
    return hash.digest().toString('base64url');
};
const generateAuthorizeUrl = (codeVerifier) => {
    const params = new URLSearchParams();
    params.append('state', generateRandom(36));
    params.append('redirect_uri', 'npf71b963c1b7b6d119://auth');
    params.append('client_id', const_1.Nintendo.clientId);
    params.append('scope', 'openid user user.birthday user.mii user.screenName');
    params.append('response_type', 'session_token_code');
    params.append('session_token_code_challenge', calcurateChallenge(codeVerifier));
    params.append('session_token_code_challenge_method', 'S256');
    return const_1.NintendoUrl.authorize + '?' + params.toString();
};
const handleBrowser = async (client, interaction) => {
    const codeVerifier = generateRandom(32);
    const authorizeUrl = generateAuthorizeUrl(codeVerifier);
    const [description, label] = (() => {
        switch (interaction.locale) {
            case 'ja':
                return [
                    `[こちら](${authorizeUrl})を開いてログインしてください。\nログインしたら、「この人にする」を右クリックし「リンクアドレスをコピー」して次へ進んでください。`,
                    '次へ'
                ];
            default:
                return [
                    `Click [here](${authorizeUrl}) and login.\nOnce logged in, right click on **Select this account** and **Copy Link Address** to proceed to the next.`,
                    'Next'
                ];
        }
    })();
    await client.sendReply(interaction, {
        embeds: [{
                title: 'STEP 1',
                color,
                description
            }],
        components: [{
                type: v10_1.ComponentType.ActionRow,
                components: [{
                        custom_id: `login_browser_${codeVerifier}`,
                        type: v10_1.ComponentType.Button,
                        style: v10_1.ButtonStyle.Danger,
                        label
                    }]
            }]
    }, true);
};
const handleAccount = async (client, interaction) => {
    const content = (() => {
        switch (interaction.locale) {
            case 'ja':
                return 'メールアドレスとパスワードによる認証は開発中です。現在は「/ろぐいん ぶらうざ」でのみログインできます。';
            default:
                return 'Authentication by email address and password is under development. Currently, you can log in only with "/login browser".';
        }
    })();
    await client.sendReply(interaction, { content }, true);
};
exports.loginCommand = {
    data: {
        name: 'login',
        name_localizations: {
            ja: 'ろぐいん'
        },
        description: 'Login to your Nintendo Account.',
        description_localizations: {
            ja: 'ニンテンドーアカウントにログインします。'
        },
        options: [
            {
                type: v10_1.ApplicationCommandOptionType.Subcommand,
                name: 'browser',
                name_localizations: {
                    ja: 'ぶらうざ'
                },
                description: 'Login to your Nintendo Account via browser authentication.',
                description_localizations: {
                    ja: 'ブラウザ認証でニンテンドーアカウントにログインします。'
                }
            },
            {
                type: v10_1.ApplicationCommandOptionType.Subcommand,
                name: 'account',
                name_localizations: {
                    ja: 'あかうんと'
                },
                description: 'Log in to your Nintendo Account with your email and password.',
                description_localizations: {
                    ja: 'メールアドレスとパスワードでニンテンドーアカウントにログインします。'
                },
                options: [
                    {
                        type: v10_1.ApplicationCommandOptionType.String,
                        name: 'email',
                        name_localizations: {
                            ja: 'メールアドレス'
                        },
                        description: 'Email is not stored on the server.',
                        description_localizations: {
                            ja: 'メールアドレスはサーバーに保存されません。'
                        },
                        required: true
                    }, {
                        type: v10_1.ApplicationCommandOptionType.String,
                        name: 'password',
                        name_localizations: {
                            ja: 'パスワード'
                        },
                        description: 'Password is not stored on the server.',
                        description_localizations: {
                            ja: 'パスワードはサーバーに保存されません。'
                        },
                        required: true
                    }
                ]
            }
        ]
    },
    handle: async (client, interaction) => {
        switch (interaction.data.options[0].name) {
            case 'browser':
                await handleBrowser(client, interaction);
                break;
            case 'account':
                await handleAccount(client, interaction);
                break;
        }
    }
};
const handleBrowserButton = async (client, interaction) => {
    const label = (() => {
        switch (interaction.locale) {
            case 'ja':
                return 'STEP 1でコピーしたリンクアドレスをペーストしてください。';
            default:
                return 'Paste the link address you copied in STEP 1.';
        }
    })();
    await client.sendModal(interaction, {
        custom_id: interaction.data.custom_id,
        title: 'STEP 2',
        components: [{
                type: v10_1.ComponentType.ActionRow,
                components: [{
                        custom_id: 'url',
                        type: v10_1.ComponentType.TextInput,
                        style: v10_1.TextInputStyle.Short,
                        label,
                        required: true,
                        placeholder: 'npf71b963c1b7b6d119://auth#...'
                    }]
            }]
    });
};
const handleBrowserModal = async (client, interaction) => {
    const sessionTokenCode = (() => {
        const value = interaction.data.components[0].components[0].value;
        try {
            return new URLSearchParams(value.slice(value.indexOf('#') + 1));
        }
        catch {
            return null;
        }
    })()?.get('session_token_code');
    if (!sessionTokenCode) {
        const content = (() => {
            switch (interaction.locale) {
                case 'ja':
                    return 'アドレスが不正です。`npf71b963c1b7b6d119://auth#session_state=XXXXX&session_token_code=XXXXX&state=XXXXX`の形式が期待されます。';
                default:
                    return 'Invalid Address. The format `npf71b963c1b7b6d119://auth#session_state=XXXXX&session_token_code=XXXXX&state=XXXXX` is expected.';
            }
        })();
        await client.sendReply(interaction, { content }, true);
        return;
    }
    await Promise.allSettled([
        client.deferReply(interaction, true),
        (async () => {
            try {
                await SessionTokenStore_1.SessionTokenStore.shared.put(interaction.member?.user.id ?? interaction.user.id, (await axios_1.default.post(const_1.NintendoUrl.sessionToken, {
                    'client_id': const_1.Nintendo.clientId,
                    'session_token_code': sessionTokenCode,
                    'session_token_code_verifier': interaction.data.custom_id.slice(14)
                })).data['session_token']);
                const content = (() => {
                    switch (interaction.locale) {
                        case 'ja':
                            return 'ログインに成功しました。';
                        default:
                            return 'Login succeeded.';
                    }
                })();
                await client.sendFollowup(interaction, { content }, true);
            }
            catch (err) {
                const content = (() => {
                    switch (interaction.locale) {
                        case 'ja':
                            return 'ログインに失敗しました。アドレスが古い可能性があります。時間をおいてSTEP 1から再度実行してください。';
                        default:
                            return 'Login failed. The address may be out of date. After a period of time, run it again from STEP 1.';
                    }
                })();
                await client.sendFollowup(interaction, {
                    content
                }, true);
                console.error('Login Error:', err);
            }
        })()
    ]);
};
const browserHandler = {
    willExec: async (interaction) => {
        return 'custom_id' in interaction.data && interaction.data.custom_id.startsWith('login_browser_');
    },
    func: async (client, interaction) => {
        switch (interaction.type) {
            case v10_1.InteractionType.MessageComponent:
                switch (interaction.data.component_type) {
                    case v10_1.ComponentType.Button:
                        await handleBrowserButton(client, interaction);
                        break;
                }
                break;
            case v10_1.InteractionType.ModalSubmit:
                await handleBrowserModal(client, interaction);
                break;
        }
    }
};
exports.loginHandlers = [
    browserHandler
];
