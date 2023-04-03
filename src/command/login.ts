import {
    Command,
    InteractionHandler,
    InteractionHandlerFunc
} from 'dinteractions.js'
import {
    APIChatInputApplicationCommandInteraction,
    APIMessageComponentButtonInteraction,
    APIModalSubmitInteraction,
    ApplicationCommandOptionType,
    ButtonStyle,
    ComponentType,
    InteractionType,
    TextInputStyle
} from 'discord-api-types/v10'
import crypto from 'crypto'
import axios from 'axios'
import { SessionTokenStore } from '../store/SessionTokenStore'
import { Nintendo, NintendoUrl } from '../util/const'

const color = 0xE60012

const generateRandom = (size: number): string => {
    return crypto.randomBytes(size).toString('base64url')
}

const calcurateChallenge = (codeVerifier: string): string => {
    const hash = crypto.createHash('sha256')
    hash.update(codeVerifier)
    return hash.digest().toString('base64url')
}

const generateAuthorizeUrl = (codeVerifier: string): string => {
    const params = new URLSearchParams()
    params.append('state', generateRandom(36))
	params.append('redirect_uri', 'npf71b963c1b7b6d119://auth')
	params.append('client_id', Nintendo.clientId)
	params.append('scope', 'openid user user.birthday user.mii user.screenName')
	params.append('response_type', 'session_token_code')
	params.append('session_token_code_challenge', calcurateChallenge(codeVerifier))
	params.append('session_token_code_challenge_method', 'S256')
    return NintendoUrl.authorize + '?' + params.toString()
}

const handleBrowser: InteractionHandlerFunc<APIChatInputApplicationCommandInteraction> = async (client, interaction) => {
    const codeVerifier = generateRandom(32)
    const authorizeUrl = generateAuthorizeUrl(codeVerifier)
    const [description, label] = (() => {
        switch (interaction.locale) {
        case 'ja':
            return [
                `[こちら](${authorizeUrl})を開いてログインしてください。\nログインしたら、「この人にする」を右クリックし「リンクアドレスをコピー」して次へ進んでください。`,
                '次へ'
            ]
        default:
            return [
                `Click [here](${authorizeUrl}) and login.\nOnce logged in, right click on **Select this account** and **Copy Link Address** to proceed to the next.`,
                'Next'
            ]
        }
    })()
    await client.sendReply(interaction, {
        embeds: [{
            title: 'STEP 1',
            color,
            description
        }],
        components: [{
            type: ComponentType.ActionRow,
            components: [{
                custom_id: `login_browser_${codeVerifier}`,
                type: ComponentType.Button,
                style: ButtonStyle.Danger,
                label
            }]
        }]
    }, true)
}

const handleAccount: InteractionHandlerFunc<APIChatInputApplicationCommandInteraction> = async (client, interaction) => {
    const content = (() => {
        switch (interaction.locale) {
        case 'ja':
            return 'メールアドレスとパスワードによる認証は開発中です。現在は「/ろぐいん ぶらうざ」でのみログインできます。'
        default:
            return 'Authentication by email address and password is under development. Currently, you can log in only with "/login browser".'
        }
    })()
    await client.sendReply(interaction, { content }, true)
}

export const loginCommand: Command = {
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
                type: ApplicationCommandOptionType.Subcommand,
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
                type: ApplicationCommandOptionType.Subcommand,
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
                        type: ApplicationCommandOptionType.String,
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
                        type: ApplicationCommandOptionType.String,
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
        switch (interaction.data.options![0].name) {
        case 'browser':
            await handleBrowser(client, interaction)
            break
        case 'account':
            await handleAccount(client, interaction)
            break
        }
    }
}

const handleBrowserButton: InteractionHandlerFunc<APIMessageComponentButtonInteraction> = async (client, interaction) => {
    const label = (() => {
        switch (interaction.locale) {
        case 'ja':
            return 'STEP 1でコピーしたリンクアドレスをペーストしてください。'
        default:
            return 'Paste the link address you copied in STEP 1.'
        }
    })()
    await client.sendModal(interaction, {
        custom_id: interaction.data.custom_id,
        title: 'STEP 2',
        components: [{
            type: ComponentType.ActionRow,
            components: [{
                custom_id: 'url',
                type: ComponentType.TextInput,
                style: TextInputStyle.Short,
                label,
                required: true,
                placeholder: 'npf71b963c1b7b6d119://auth#...'
            }]
        }]
    })
}

const handleBrowserModal: InteractionHandlerFunc<APIModalSubmitInteraction> = async (client, interaction) => {
    const sessionTokenCode = (() => {
        const value = interaction.data.components[0]!.components[0].value
        try {
            return new URLSearchParams(value.slice(value.indexOf('#') + 1))
        } catch {
            return null
        }
    })()?.get('session_token_code')
    if (!sessionTokenCode) {
        const content = (() => {
            switch (interaction.locale) {
            case 'ja':
                return 'アドレスが不正です。`npf71b963c1b7b6d119://auth#session_state=XXXXX&session_token_code=XXXXX&state=XXXXX`の形式が期待されます。'
            default:
                return 'Invalid Address. The format `npf71b963c1b7b6d119://auth#session_state=XXXXX&session_token_code=XXXXX&state=XXXXX` is expected.'
            }
        })()
        await client.sendReply(interaction, { content }, true)
        return
    }
    await Promise.allSettled([
        client.deferReply(interaction, true),
        (async () => {
            try {
                await SessionTokenStore.shared.put(
                    interaction.member?.user.id ?? interaction.user!.id,
                    (await axios.post(NintendoUrl.sessionToken, {
                        'client_id': Nintendo.clientId,
                        'session_token_code': sessionTokenCode,
                        'session_token_code_verifier': interaction.data.custom_id.slice(14)
                    })).data['session_token']
                )
                const content = (() => {
                    switch (interaction.locale) {
                    case 'ja':
                        return 'ログインに成功しました。'
                    default:
                        return 'Login succeeded.'
                    }
                })()
                await client.sendFollowup(interaction, { content }, true)
            } catch (err) {
                const content = (() => {
                    switch (interaction.locale) {
                    case 'ja':
                        return 'ログインに失敗しました。アドレスが古い可能性があります。時間をおいてSTEP 1から再度実行してください。'
                    default:
                        return 'Login failed. The address may be out of date. After a period of time, run it again from STEP 1.'
                    }
                })()
                await client.sendFollowup(interaction, {
                    content
                }, true)
                console.error('Login Error:', err)
            }
        })()
    ])
}

const browserHandler: InteractionHandler = {
    willExec: async interaction => {
        return 'custom_id' in interaction.data && interaction.data.custom_id.startsWith('login_browser_')
    },
    func: async (client, interaction) => {
        switch (interaction.type) {
        case InteractionType.MessageComponent:
            switch (interaction.data.component_type) {
            case ComponentType.Button:
                await handleBrowserButton(client, interaction as APIMessageComponentButtonInteraction)
                break
            }
            break
        case InteractionType.ModalSubmit:
            await handleBrowserModal(client, interaction)
            break
        }
    }
}

export const loginHandlers: InteractionHandler[] = [
    browserHandler
]
