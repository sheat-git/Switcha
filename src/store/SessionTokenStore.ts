import { BaseStore } from './BaseStore'

class SessionTokenStoreInternal extends BaseStore<{
    key: string
    token: string
}> {
    static shared = new SessionTokenStoreInternal('SessionToken')
}

export class SessionTokenStore {
    private constructor() {}

    static shared = new SessionTokenStore()
    
    async get(discordId: string): Promise<string | null> {
        return (await SessionTokenStoreInternal.shared.get(discordId))?.token ?? null
    }

    async put(discordId: string, token: string) {
        await SessionTokenStoreInternal.shared.put({ key: discordId, token })
    }

    async delete(discordId: string) {
        await SessionTokenStoreInternal.shared.delete(discordId)
    }
}
