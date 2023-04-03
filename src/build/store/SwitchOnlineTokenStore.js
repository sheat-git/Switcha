"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwitchOnlineTokenStore = void 0;
const BaseStore_1 = require("./BaseStore");
class SwitchOnlineTokenStoreInternal extends BaseStore_1.BaseStore {
}
SwitchOnlineTokenStoreInternal.shared = new SwitchOnlineTokenStoreInternal('ApiToken');
class SwitchOnlineTokenStore {
    constructor() { }
    async get(discordId) {
        return (await SwitchOnlineTokenStoreInternal.shared.get(discordId))?.token ?? null;
    }
    async put(discordId, token, expireIn) {
        await SwitchOnlineTokenStoreInternal.shared.put({ key: discordId, token }, { expireIn });
    }
}
SwitchOnlineTokenStore.shared = new SwitchOnlineTokenStore();
exports.SwitchOnlineTokenStore = SwitchOnlineTokenStore;
