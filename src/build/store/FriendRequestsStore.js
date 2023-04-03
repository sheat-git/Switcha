"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRequestsStore = void 0;
const BaseStore_1 = require("./BaseStore");
class FriendRequestsStoreInternal extends BaseStore_1.BaseStore {
}
FriendRequestsStoreInternal.shared = new FriendRequestsStoreInternal('FriendRequests');
class FriendRequestsStore {
    constructor() { }
    async get(id) {
        return (await FriendRequestsStoreInternal.shared.get(id))?.nsaIds ?? null;
    }
    async put(id, nsaIds) {
        await FriendRequestsStoreInternal.shared.put({
            key: id,
            nsaIds
        }, {
            expireIn: 3600
        });
    }
}
FriendRequestsStore.shared = new FriendRequestsStore();
exports.FriendRequestsStore = FriendRequestsStore;
