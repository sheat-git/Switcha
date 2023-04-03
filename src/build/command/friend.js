"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendHandlers = exports.friendCommand = void 0;
const v10_1 = require("discord-api-types/v10");
const FriendRequestsStore_1 = require("../store/FriendRequestsStore");
const getSwitchOnlineToken_1 = require("../util/getSwitchOnlineToken");
const color = 0xE60012;
const handleError = (client, interaction, error) => {
    if ('errorMessage' in error) {
        client.sendFollowup(interaction, {
            content: `Error \`${error.status}\`: ${error.errorMessage}`
        }).catch();
        return true;
    }
    else {
        return false;
    }
};
const generateUsersText = (users) => {
    let text = '```ansi\n';
    for (const user of users) {
        text += `\u001b[0m${user.name} \u001b[30m(${user.friendCode})\u001b[0m\n`;
    }
    return text + '```';
};
const extractFriendCodes = (text) => {
    const friendCodes = text.match(/\d{4}-?\d{4}-?\d{4}/g);
    return friendCodes?.map(c => c.match(/\d{4}/g).join('-')) ?? [];
};
const handleRequest = async (client, interaction) => {
    const friendCodeText = interaction.data.options[0].options[0].value;
    const friendCode = extractFriendCodes(friendCodeText)[0];
    if (!friendCode) {
        const content = (() => {
            switch (interaction.locale) {
                case 'ja':
                    return '`フレンドコード`が正しく入力されていません。`0000-0000-0000`または`000000000000`の形式で再度お試しください。';
                default:
                    return 'The `friend_code` is not entered correctly. Please try again with the format `0000-0000-0000` or `000000000000`.';
            }
        })();
        await client.sendReply(interaction, { content }, true);
        return;
    }
    const service = await (0, getSwitchOnlineToken_1.getSwitchOnlineServiceWithInteraction)(client, interaction, true);
    if (!service) {
        return;
    }
    const user = await service.getUserByFriendCode({ friendCode });
    if (handleError(client, interaction, user)) {
        return;
    }
    const [description, label] = (() => {
        switch (interaction.locale) {
            case 'ja':
                return [
                    '以下のユーザーにフレンド申請を送信しますがよろしいですか。',
                    'フレンド申請する'
                ];
            default:
                return [
                    'Are you sure you want to send a friend request to the following user?',
                    'Send Request'
                ];
        }
    })();
    await client.sendFollowup(interaction, {
        embeds: [{
                description: description + generateUsersText([{ friendCode, name: user.name }]),
                color
            }],
        components: [{
                type: v10_1.ComponentType.ActionRow,
                components: [{
                        type: v10_1.ComponentType.Button,
                        custom_id: `friend_request_${user.nsaId}`,
                        style: v10_1.ButtonStyle.Danger,
                        label
                    }]
            }]
    });
};
const handleRequests = async (client, interaction) => {
    const friendCodesText = interaction.data.options[0].options[0].value;
    const friendCodes = extractFriendCodes(friendCodesText);
    if (!friendCodes.length) {
        const content = (() => {
            switch (interaction.locale) {
                case 'ja':
                    return '`フレンドコード`が正しく入力されていません。`0000-0000-0000`または`000000000000`の形式で再度お試しください。';
                default:
                    return 'The `text` is not entered correctly. Please try again with the format `0000-0000-0000` or `000000000000`.';
            }
        })();
        await client.sendReply(interaction, { content }, true);
        return;
    }
    const service = await (0, getSwitchOnlineToken_1.getSwitchOnlineServiceWithInteraction)(client, interaction, true);
    if (!service) {
        return;
    }
    const res = await Promise.all(friendCodes.map(async (friendCode) => {
        const user = await service.getUserByFriendCode({ friendCode });
        if ('errorMessage' in user) {
            return {
                nsaId: undefined,
                friendCode
            };
        }
        return {
            name: user.name,
            nsaId: user.nsaId,
            friendCode
        };
    }));
    const erroredFriendCodes = res.filter(user => user.nsaId === undefined).map(user => user.friendCode);
    const users = res.filter(user => user.nsaId !== undefined);
    const embeds = [];
    if (erroredFriendCodes.length) {
        embeds.push({
            description: (() => {
                switch (interaction.locale) {
                    case 'ja':
                        return '以下のフレンドコードが見つかりませんでした。';
                    default:
                        return 'The following friend codes were not found.';
                }
            })() + '```' + erroredFriendCodes.join('\n') + '```',
            color
        });
    }
    if (users.length) {
        embeds.push({
            description: (() => {
                switch (interaction.locale) {
                    case 'ja':
                        return '以下のユーザーにフレンド申請を送信しますがよろしいですか。';
                    default:
                        return 'Are you sure you want to send friend requests to the following users?';
                }
            })() + generateUsersText(users),
            color
        });
        await FriendRequestsStore_1.FriendRequestsStore.shared.put(interaction.id, users.map(user => user.nsaId));
    }
    await client.sendFollowup(interaction, {
        embeds,
        components: users.length ? [{
                type: v10_1.ComponentType.ActionRow,
                components: [{
                        type: v10_1.ComponentType.Button,
                        custom_id: `friend_requests_${interaction.id}`,
                        style: v10_1.ButtonStyle.Danger,
                        label: (() => {
                            switch (interaction.locale) {
                                case 'ja':
                                    return 'フレンド申請する';
                                default:
                                    return 'Send Requests';
                            }
                        })()
                    }]
            }] : []
    });
};
const handleCode = async (client, interaction) => {
    const service = await (0, getSwitchOnlineToken_1.getSwitchOnlineServiceWithInteraction)(client, interaction, false);
    if (!service) {
        return;
    }
    const data = await service.createFriendCodeUrl();
    if (handleError(client, interaction, data)) {
        return;
    }
    await client.sendFollowup(interaction, {
        content: data.friendCode,
        components: [{
                type: v10_1.ComponentType.ActionRow,
                components: [
                    {
                        type: v10_1.ComponentType.Button,
                        label: 'Send Request',
                        style: v10_1.ButtonStyle.Danger,
                        custom_id: 'friend_code_' + data.friendCode
                    },
                    {
                        type: v10_1.ComponentType.Button,
                        label: 'Request Link',
                        style: v10_1.ButtonStyle.Link,
                        url: data.url
                    }
                ]
            }]
    });
};
exports.friendCommand = {
    data: {
        name: 'friend',
        name_localizations: {
            ja: 'ふれんど'
        },
        description: 'Operation regarding friends.',
        description_localizations: {
            ja: 'フレンドに関する操作をします。'
        },
        options: [
            {
                type: v10_1.ApplicationCommandOptionType.Subcommand,
                name: 'request',
                name_localizations: {
                    ja: 'しんせい'
                },
                description: 'Make a friend request.',
                description_localizations: {
                    ja: 'フレンド申請を行います。'
                },
                options: [{
                        type: v10_1.ApplicationCommandOptionType.String,
                        name: 'friend_code',
                        name_localizations: {
                            ja: 'フレンドコード'
                        },
                        description: 'You can use the text including "SW" and hyphens.',
                        description_localizations: {
                            ja: '「SW、ハイフン（-）」が含まれていても使用できます。'
                        },
                        required: true
                    }]
            },
            {
                type: v10_1.ApplicationCommandOptionType.Subcommand,
                name: 'requests',
                name_localizations: {
                    ja: 'ふくすうしんせい'
                },
                description: 'Send more than one friend request at a time.',
                description_localizations: {
                    ja: '1度に複数のフレンド申請を送ります。'
                },
                options: [{
                        type: v10_1.ApplicationCommandOptionType.String,
                        name: 'text',
                        name_localizations: {
                            ja: 'テキスト'
                        },
                        description: 'Only strings of the form "0000-0000-0000" are accepted as friend codes.',
                        description_localizations: {
                            ja: '「0000-0000-0000」の形式の文字列のみフレンドコードとして受け入れられます。'
                        },
                        required: true
                    }]
            },
            {
                type: v10_1.ApplicationCommandOptionType.Subcommand,
                name: 'code',
                name_localizations: {
                    ja: 'こーど'
                },
                description: 'Show your friend code.',
                description_localizations: {
                    ja: 'フレンドコードを表示します。'
                }
            }
        ]
    },
    handle: async (client, interaction) => {
        switch (interaction.data.options[0].name) {
            case 'request':
                await handleRequest(client, interaction);
                break;
            case 'requests':
                await handleRequests(client, interaction);
                break;
            case 'code':
                await handleCode(client, interaction);
                break;
        }
    }
};
const codeHandler = {
    willExec: async (interaction) => {
        return 'custom_id' in interaction.data && interaction.data.custom_id.startsWith('friend_code_');
    },
    func: async (client, interaction) => {
        const service = await (0, getSwitchOnlineToken_1.getSwitchOnlineServiceWithInteraction)(client, interaction, true);
        if (!service) {
            return;
        }
        const friendCode = interaction.data.custom_id.slice(12);
        const user = await service.getUserByFriendCode({ friendCode });
        if (handleError(client, interaction, user)) {
            return;
        }
        const request = await service.createFriendRequest({ nsaId: user.nsaId });
        if (handleError(client, interaction, request)) {
            return;
        }
        const content = (() => {
            switch (interaction.locale) {
                case 'ja':
                    return 'フレンド申請を送信しました。';
                default:
                    return 'Friend request has been sent.';
            }
        })();
        await client.sendFollowup(interaction, { content });
    }
};
const requestHandler = {
    willExec: async (interaction) => {
        return 'custom_id' in interaction.data && interaction.data.custom_id.startsWith('friend_request_');
    },
    func: async (client, interaction) => {
        const nsaId = interaction.data.custom_id.slice(15);
        const service = await (0, getSwitchOnlineToken_1.getSwitchOnlineServiceWithInteraction)(client, interaction, true);
        if (!service) {
            return;
        }
        const request = await service.createFriendRequest({ nsaId });
        if (handleError(client, interaction, request)) {
            return;
        }
        const content = (() => {
            switch (interaction.locale) {
                case 'ja':
                    return 'フレンド申請を送信しました。';
                default:
                    return 'Friend request has been sent.';
            }
        })();
        await client.sendFollowup(interaction, { content });
    }
};
const requestsHandler = {
    willExec: async (interaction) => {
        return 'custom_id' in interaction.data && interaction.data.custom_id.startsWith('friend_requests_');
    },
    func: async (client, interaction) => {
        const id = interaction.data.custom_id.slice(16);
        const nsaIds = await FriendRequestsStore_1.FriendRequestsStore.shared.get(id);
        if (!nsaIds) {
            await client.sendReply(interaction, {
                content: (() => {
                    switch (interaction.locale) {
                        case 'ja':
                            return 'データが見つかりません。再度コマンドから実行してください。';
                        default:
                            return 'Data not found. Please try again from the command.';
                    }
                })()
            });
            return;
        }
        const service = await (0, getSwitchOnlineToken_1.getSwitchOnlineServiceWithInteraction)(client, interaction, true);
        if (!service) {
            return;
        }
        const res = await Promise.allSettled(nsaIds.map(nsaId => service.createFriendRequest({ nsaId })));
        if (res.some(r => r.status === 'rejected' || 'errorMessage' in r.value)) {
            await client.sendFollowup(interaction, {
                content: (() => {
                    switch (interaction.locale) {
                        case 'ja':
                            return '一部のフレンド申請に問題がありましたが、完了しました。原因としては、「すでにフレンドである」「2度目の申請である」「自身へ申請しようとしている」などが考えられます。';
                        default:
                            return 'There was a problem with some friend requests, but it has been completed. The possible causes include "already a friend," "second application," or "trying to apply to yourself.';
                    }
                })()
            });
            return;
        }
        await client.sendFollowup(interaction, {
            content: (() => {
                switch (interaction.locale) {
                    case 'ja':
                        return 'フレンド申請を送信しました。';
                    default:
                        return 'Friend requests have been sent.';
                }
            })()
        });
    }
};
exports.friendHandlers = [
    codeHandler,
    requestHandler,
    requestsHandler
];
