"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseStore = void 0;
const deta_1 = require("./deta");
class BaseStore {
    constructor(baseName) {
        this.db = deta_1.deta.Base(baseName);
    }
    async get(key) {
        return await this.db.get(key);
    }
    async put(item, options) {
        await this.db.put(item, undefined, options);
    }
    async putMany(items, options) {
        await this.db.putMany(items, options);
    }
    async update(item, options) {
        await this.db.update(item, item.key, options);
    }
    async delete(key) {
        await this.db.delete(key);
    }
    async fetch(query, options) {
        const res = await this.db.fetch(query, options);
        return {
            items: res.items,
            count: res.count,
            last: res.last ?? null
        };
    }
}
exports.BaseStore = BaseStore;
