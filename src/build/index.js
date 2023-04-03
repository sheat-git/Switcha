"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const client_1 = require("./client");
const app = (0, express_1.default)();
app.use((err, _, res, next) => {
    res.sendStatus(500).end();
    console.error(err);
    next(err);
});
app.get('/interactions/sync-commands', async (_, res) => {
    await client_1.client.syncCommands();
    res.sendStatus(200).end();
});
app.post('/interactions', client_1.client.handlers);
app.listen(parseInt(process.env.PORT));
