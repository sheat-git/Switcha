"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStore = void 0;
const BaseStore_1 = require("./BaseStore");
class SessionStore extends BaseStore_1.BaseStore {
}
SessionStore.shared = new SessionStore('Session');
exports.SessionStore = SessionStore;
