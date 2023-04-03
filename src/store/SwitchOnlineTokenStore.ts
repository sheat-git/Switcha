import { BaseStore } from './BaseStore'

class SwitchOnlineTokenStoreInternal extends BaseStore<{
    key: string
    token: string
}> {
    static shared = new SwitchOnlineTokenStoreInternal('ApiToken')
}

export class SwitchOnlineTokenStore {
    private constructor() {}

    static shared = new SwitchOnlineTokenStore()

    async get(discordId: string): Promise<string | null> {
        return (await SwitchOnlineTokenStoreInternal.shared.get(discordId))?.token ?? null
    }

    async put(discordId: string, token: string, expireIn: number) {
        await SwitchOnlineTokenStoreInternal.shared.put({ key: discordId, token }, { expireIn })
    }
}
