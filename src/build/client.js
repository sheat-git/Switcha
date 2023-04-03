"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const dinteractions_js_1 = require("dinteractions.js");
const friend_1 = require("./command/friend");
const login_1 = require("./command/login");
exports.client = new dinteractions_js_1.Client({
    applicationId: process.env.DISCORD_APPLICATION_ID,
    publicKey: process.env.DISCORD_PUBLIC_KEY,
    token: process.env.DISCORD_BOT_TOKEN
});
exports.client.addCommand(login_1.loginCommand, friend_1.friendCommand);
exports.client.addHandler(...login_1.loginHandlers, ...friend_1.friendHandlers);
