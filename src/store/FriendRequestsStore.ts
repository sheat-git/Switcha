import { BaseStore } from './BaseStore'

class FriendRequestsStoreInternal extends BaseStore<{
    key: string
    nsaIds: string[]
}> {
    static shared = new FriendRequestsStoreInternal('FriendRequests')
}

export class FriendRequestsStore {
    private constructor() {}

    static shared = new FriendRequestsStore()

    async get(id: string): Promise<string[] | null> {
        return (await FriendRequestsStoreInternal.shared.get(id))?.nsaIds ?? null
    }

    async put(id: string, nsaIds: string[]) {
        await FriendRequestsStoreInternal.shared.put({
            key: id,
            nsaIds
        }, {
            expireIn: 3600
        })
    }
}
