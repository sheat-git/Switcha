"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const rest_1 = require("@discordjs/rest");
const v10_1 = require("discord-api-types/v10");
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
class Client {
    get handlers() {
        return [this.verify(), this.handle()];
    }
    constructor(options) {
        this.applicationId = options.applicationId;
        this.publicKey = options.publicKey;
        this.rest = new rest_1.REST({ version: '10' }).setToken(options.token);
        this.commands = new Map();
        this.guildCommands = new Map();
        this.handleAutocomplete = options.handleAutocomplete ?? (async (_) => undefined);
        this.handleInteraction = options.handleInteraction ?? (async (_c, _i) => { });
        this.interactionHandlers = [];
    }
    async ping() {
        const start = Date.now();
        await this.rest.get(v10_1.Routes.gateway());
        return Date.now() - start;
    }
    static _addCommand(commands, command) {
        const type = command.type ?? v10_1.ApplicationCommandType.ChatInput;
        const typedCommands = commands.get(type);
        if (typedCommands) {
            typedCommands.set(command.data.name, command);
        }
        else {
            commands.set(type, new Map().set(command.data.name, command));
        }
    }
    addCommand(...command) {
        command.forEach(c => { Client._addCommand(this.commands, c); });
    }
    addGuildCommand(guildId, ...command) {
        const commands = this.guildCommands.get(guildId);
        if (commands) {
            command.forEach(c => { Client._addCommand(commands, c); });
        }
        else {
            const newCommands = new Map();
            this.guildCommands.set(guildId, newCommands);
            command.forEach(c => { Client._addCommand(newCommands, c); });
        }
    }
    addHandler(...handler) {
        this.interactionHandlers.push(...handler);
    }
    async fetchCommands(withLocalizations) {
        const query = (withLocalizations !== undefined)
            ? new URLSearchParams({ with_localizations: withLocalizations ? 'true' : 'false' })
            : undefined;
        return await this.rest.get(v10_1.Routes.applicationCommands(this.applicationId), { query });
    }
    async fetchGuildCommands(guildId, withLocalizations) {
        const query = (withLocalizations !== undefined)
            ? new URLSearchParams({ with_localizations: withLocalizations ? 'true' : 'false' })
            : undefined;
        return await this.rest.get(v10_1.Routes.applicationGuildCommands(this.applicationId, guildId), { query });
    }
    async registerCommand(command) {
        return await this.rest.post(v10_1.Routes.applicationCommands(this.applicationId), { body: command });
    }
    async registerGuildCommand(guildId, command) {
        return await this.rest.post(v10_1.Routes.applicationGuildCommands(this.applicationId, guildId), { body: command });
    }
    async fetchCommand(commandId) {
        return await this.rest.get(v10_1.Routes.applicationCommand(this.applicationId, commandId));
    }
    async fetchGuildCommand(guildId, commandId) {
        return await this.rest.get(v10_1.Routes.applicationGuildCommand(this.applicationId, guildId, commandId));
    }
    async editCommand(commandId, command) {
        return await this.rest.patch(v10_1.Routes.applicationCommand(this.applicationId, commandId), { body: command });
    }
    async editGuildCommand(guildId, commandId, command) {
        return await this.rest.patch(v10_1.Routes.applicationGuildCommand(this.applicationId, guildId, commandId), { body: command });
    }
    async deleteCommand(commandId) {
        await this.rest.delete(v10_1.Routes.applicationCommand(this.applicationId, commandId));
    }
    async deleteGuildCommand(guildId, commandId) {
        await this.rest.delete(v10_1.Routes.applicationGuildCommand(this.applicationId, guildId, commandId));
    }
    async updateCommands(commands) {
        return await this.rest.put(v10_1.Routes.applicationCommands(this.applicationId), { body: commands });
    }
    async updateGuildCommands(guildId, commands) {
        return await this.rest.put(v10_1.Routes.applicationGuildCommands(this.applicationId, guildId), { body: commands });
    }
    async syncCommands() {
        const getCommands = (commands) => {
            return Array.from(commands.entries()).flatMap(([type, v]) => Array.from(v.values(), c => {
                return { ...c.data, type };
            }));
        };
        await Promise.allSettled([
            this.updateCommands(getCommands(this.commands)),
            ...Array.from(this.guildCommands, ([g, c]) => {
                if (g === '') {
                    return Promise.resolve(0);
                }
                return this.updateGuildCommands(g, getCommands(c));
            })
        ]);
    }
    async sendCallback(interaction, body) {
        await this.rest.post(v10_1.Routes.interactionCallback(interaction.id, interaction.token), { body });
    }
    async sendReply(interaction, message, ephemeral = false) {
        if (ephemeral) {
            if (message.flags) {
                message.flags |= v10_1.MessageFlags.Ephemeral;
            }
            else {
                message.flags = v10_1.MessageFlags.Ephemeral;
            }
        }
        const body = {
            type: v10_1.InteractionResponseType.ChannelMessageWithSource,
            data: message
        };
        await this.sendCallback(interaction, body);
    }
    async deferReply(interaction, ephemeral = false) {
        const body = {
            type: v10_1.InteractionResponseType.DeferredChannelMessageWithSource,
            data: {
                flags: ephemeral ? v10_1.MessageFlags.Ephemeral : undefined
            }
        };
        await this.sendCallback(interaction, body);
    }
    async deferUpdate(interaction) {
        const body = {
            type: v10_1.InteractionResponseType.DeferredMessageUpdate
        };
        await this.sendCallback(interaction, body);
    }
    async sendUpdate(interaction, message) {
        const body = {
            type: v10_1.InteractionResponseType.UpdateMessage,
            data: message
        };
        await this.sendCallback(interaction, body);
    }
    async sendModal(interaction, modal) {
        const body = {
            type: v10_1.InteractionResponseType.Modal,
            data: modal
        };
        await this.sendCallback(interaction, body);
    }
    async fetchReply(interaction) {
        return await this.rest.get(v10_1.Routes.webhookMessage(this.applicationId, interaction.token));
    }
    async editReply(interaction, message) {
        return await this.rest.patch(v10_1.Routes.webhookMessage(this.applicationId, interaction.token), { body: message });
    }
    async deleteReply(interaction) {
        await this.rest.delete(v10_1.Routes.webhookMessage(this.applicationId, interaction.token));
    }
    async sendFollowup(interaction, message, ephemeral = false) {
        if (ephemeral) {
            if (message.flags) {
                message.flags |= v10_1.MessageFlags.Ephemeral;
            }
            else {
                message.flags = v10_1.MessageFlags.Ephemeral;
            }
        }
        return await this.rest.post(v10_1.Routes.webhook(this.applicationId, interaction.token), { body: message });
    }
    async fetchFollowup(interaction, messageId) {
        return await this.rest.get(v10_1.Routes.webhookMessage(this.applicationId, interaction.token, messageId));
    }
    async editFollowup(interaction, messageId, message) {
        return await this.rest.patch(v10_1.Routes.webhookMessage(this.applicationId, interaction.token, messageId), { body: message });
    }
    async deleteFollowup(interaction, messageId) {
        await this.rest.delete(v10_1.Routes.webhookMessage(this.applicationId, interaction.token, messageId));
    }
    verify() {
        return (req, res, next) => {
            const abort = () => {
                res.sendStatus(401).end();
            };
            const signature = req.get('X-Signature-Ed25519');
            const timestamp = req.get('X-Signature-Timestamp');
            if (signature === undefined || timestamp === undefined) {
                abort();
                return;
            }
            const onBodyComplete = (rawBody) => {
                try {
                    const isVerified = tweetnacl_1.default.sign.detached.verify(Buffer.from(timestamp + rawBody), Buffer.from(signature, 'hex'), Buffer.from(this.publicKey, 'hex'));
                    if (isVerified) {
                        req.body = JSON.parse(rawBody);
                        next();
                    }
                    else {
                        abort();
                    }
                }
                catch (e) {
                    abort();
                }
            };
            if (req.body) {
                if (typeof req.body === 'string') {
                    onBodyComplete(req.body);
                }
                else if (Buffer.isBuffer(req.body)) {
                    onBodyComplete(req.body.toString());
                }
                else {
                    onBodyComplete(JSON.stringify(req.body));
                }
            }
            else {
                let rawBody = '';
                req.on('data', chunk => {
                    rawBody += chunk.toString();
                });
                req.on('end', () => {
                    onBodyComplete(rawBody);
                });
            }
        };
    }
    handle() {
        return async (req, res) => {
            const interaction = req.body;
            switch (interaction.type) {
                case v10_1.InteractionType.Ping:
                    const pong = {
                        type: v10_1.InteractionResponseType.Pong
                    };
                    res.json(pong).end();
                    return;
                case v10_1.InteractionType.ApplicationCommand:
                    res.status(204);
                    await this._handleApplicationCommand(interaction);
                    return;
                case v10_1.InteractionType.MessageComponent:
                    res.status(204);
                    await this._handleInteraction(interaction);
                    return;
                case v10_1.InteractionType.ApplicationCommandAutocomplete:
                    const autocompleteData = await this._handleAutocomplete(interaction);
                    if (autocompleteData === undefined) {
                        res.status(204).end();
                    }
                    else {
                        const autocomplete = {
                            type: v10_1.InteractionResponseType.ApplicationCommandAutocompleteResult,
                            data: autocompleteData
                        };
                        res.json(autocomplete).end();
                    }
                    return;
                case v10_1.InteractionType.ModalSubmit:
                    res.status(204);
                    await this._handleInteraction(interaction);
                    return;
            }
        };
    }
    async _handleApplicationCommand(interaction) {
        const handle = (() => {
            if (interaction.guild_id) {
                return this.guildCommands
                    .get(interaction.guild_id)
                    ?.get(interaction.data.type)
                    ?.get(interaction.data.name)
                    ?? this.guildCommands
                        .get('')
                        ?.get(interaction.data.type)
                        ?.get(interaction.data.name);
            }
            else {
                return this.commands
                    .get(interaction.data.type)
                    ?.get(interaction.data.name);
            }
        })()?.handle;
        if (handle) {
            // @ts-ignore
            await handle(this, interaction);
        }
        else {
            await this._handleInteraction(interaction);
        }
    }
    async _handleInteraction(interaction) {
        for (const handler of this.interactionHandlers) {
            if (await handler.willExec(interaction)) {
                await handler.func(this, interaction);
                if (!handler.execNext) {
                    return;
                }
            }
        }
        await this.handleInteraction(this, interaction);
    }
    async _handleAutocomplete(interaction) {
        const handle = (() => {
            if (interaction.guild_id) {
                return this.guildCommands
                    .get(interaction.guild_id)
                    ?.get(interaction.data.type)
                    ?.get(interaction.data.name)
                    ?? this.guildCommands
                        .get('')
                        ?.get(interaction.data.type)
                        ?.get(interaction.data.name);
            }
            else {
                return this.commands
                    .get(interaction.data.type)
                    ?.get(interaction.data.name);
            }
        })()?.handleAutocomplete;
        if (handle) {
            // @ts-ignore
            return await handle(interaction);
        }
        else {
            return await this.handleAutocomplete(interaction);
        }
    }
    serve(path, port) {
        const app = (0, express_1.default)();
        app.use((err, req, res, next) => {
            res.sendStatus(500).end();
            console.error(err);
            next(err);
        });
        app.post(path, this.handlers);
        app.listen(port);
    }
}
exports.Client = Client;
