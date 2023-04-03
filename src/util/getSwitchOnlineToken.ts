import axios from 'axios'
import { Client } from 'dinteractions.js'
import {
    APIApplicationCommandInteraction,
    APIMessageComponentInteraction,
    APIModalSubmitInteraction
} from 'discord-api-types/v10'
import FormData from 'form-data'
import { SwitchOnlineService } from '../service/SwitchOnlineService'
import { SessionTokenStore } from '../store/SessionTokenStore'
import { SwitchOnlineTokenStore } from '../store/SwitchOnlineTokenStore'
import { Nintendo, NintendoUrl } from './const'

type ApiToken = {
    id: string
    access: string
}

type UserInfo = {
    language: string
    country: string
    birthday: string
}

type F = {
    f: string
    timestamp: string
    requestId: string
}

const getApiToken = async (sessionToken: string): Promise<ApiToken> => {
    const res = await axios.post(NintendoUrl.apiToken, {
        'client_id': Nintendo.clientId,
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer-session-token',
        'session_token': sessionToken,
    })
    return {
        id: res.data['id_token'],
        access: res.data['access_token']
    }
}

const getUserInfo = async (accessToken: string): Promise<UserInfo> => {
    const res = await axios.get(NintendoUrl.me, {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
    return {
        language: res.data['language'],
        country: res.data['country'],
        birthday: res.data['birthday']
    }
}

const getF = async (idToken: string): Promise<{
    f: string
    timestamp: string
    requestId: string
}> => {
    const res = await axios.post('https://api.imink.app/f', {
        "token": idToken,
        "hash_method": 1
    })
    return {
        f: res.data['f'],
        timestamp: res.data['timestamp'].toString(),
        requestId: res.data['request_id']
    }
}

const getToken = async (params: {
    idToken: string
    timestamp: string
    requestId: string
    userInfo: UserInfo
    f: string
}): Promise<{
    token: string
    expiresIn: number
}> => {
    const res = await axios.post(NintendoUrl.login, {
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
    })
    const credential = res.data['result']['webApiServerCredential']
    return {
        token: credential['accessToken'],
        expiresIn: credential['expiresIn']
    }
}

export const getSwitchOnlineToken = async (discordId: string): Promise<string | null> => {
    const storedToken = await SwitchOnlineTokenStore.shared.get(discordId)
    if (storedToken) {
        return storedToken
    }
    const sessionToken = await SessionTokenStore.shared.get(discordId)
    if (!sessionToken) {
        return null
    }
    const apiToken = await getApiToken(sessionToken)
    const [userInfo, f] = await Promise.all([
        getUserInfo(apiToken.access),
        getF(apiToken.id)
    ])
    const data = await getToken({
        idToken: apiToken.id,
        userInfo,
        ...f
    })
    await SwitchOnlineTokenStore.shared.put(discordId, data.token, data.expiresIn - 10)
    return data.token
}

export const getSwitchOnlineTokenWithInteraction = async (
    client: Client,
    interaction: APIApplicationCommandInteraction | APIMessageComponentInteraction | APIModalSubmitInteraction,
    ephemeral: boolean
): Promise<string | null> => {
    const discordId = interaction.member?.user.id ?? interaction.user!.id
    const storedToken = await SwitchOnlineTokenStore.shared.get(discordId)
    if (storedToken) {
        await client.deferReply(interaction, ephemeral)
        return storedToken
    }
    const sessionToken = await SessionTokenStore.shared.get(discordId)
    if (!sessionToken) {
        await client.sendReply(interaction, {
            content: (() => {
                switch (interaction.locale) {
                case 'ja':
                    return 'この操作にはログインが必要です。ログインは「/ろぐいん」コマンドで可能です。'
                default:
                    return 'This operation requires login. You can log in with the "/login" command.'
                }
            })()
        }, true)
        return null
    }
    const [_, res] = await Promise.allSettled([
        client.deferReply(interaction, ephemeral),
        (async () => {
            const apiToken = await getApiToken(sessionToken)
            const [userInfo, f] = await Promise.all([
                getUserInfo(apiToken.access),
                getF(apiToken.id)
            ])
            return await getToken({
                idToken: apiToken.id,
                userInfo,
                ...f
            })
        })()
    ])
    if (res.status === 'fulfilled') {
        await SwitchOnlineTokenStore.shared.put(discordId, res.value.token, res.value.expiresIn - 10)
        return res.value.token
    } else {
        await client.sendFollowup(interaction, {
            content: (() => {
                switch (interaction.locale) {
                case 'ja':
                    return '何らかのエラーが発生しました。時間をおいて再度お試しください。'
                default:
                    return 'Some error occurred. Please try again in a few minutes.'
                }
            })()
        }, ephemeral)
        return null
    }
}

export const getSwitchOnlineService = async (discordId: string): Promise<SwitchOnlineService | null> => {
    const token = await getSwitchOnlineToken(discordId)
    return token ? new SwitchOnlineService(token) : null
}

export const getSwitchOnlineServiceWithInteraction = async(
    client: Client,
    interaction: APIApplicationCommandInteraction | APIMessageComponentInteraction | APIModalSubmitInteraction,
    ephemeral: boolean
): Promise<SwitchOnlineService | null> => {
    const token = await getSwitchOnlineTokenWithInteraction(client, interaction, ephemeral)
    return token ? new SwitchOnlineService(token) : null
}
