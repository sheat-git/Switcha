"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionTokenStore = void 0;
const BaseStore_1 = require("./BaseStore");
class SessionTokenStoreInternal extends BaseStore_1.BaseStore {
}
SessionTokenStoreInternal.shared = new SessionTokenStoreInternal('SessionToken');
class SessionTokenStore {
    constructor() { }
    async get(discordId) {
        return (await SessionTokenStoreInternal.shared.get(discordId))?.token ?? null;
    }
    async put(discordId, token) {
        await SessionTokenStoreInternal.shared.put({ key: discordId, token });
    }
    async delete(discordId) {
        await SessionTokenStoreInternal.shared.delete(discordId);
    }
}
SessionTokenStore.shared = new SessionTokenStore();
exports.SessionTokenStore = SessionTokenStore;
