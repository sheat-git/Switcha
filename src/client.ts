import { Client } from 'dinteractions.js'
import { friendCommand, friendHandlers } from './command/friend'
import { loginCommand, loginHandlers } from './command/login'

export const client = new Client({
    applicationId: process.env.DISCORD_APPLICATION_ID!,
    publicKey: process.env.DISCORD_PUBLIC_KEY!,
    token: process.env.DISCORD_BOT_TOKEN!
})


client.addCommand(
    loginCommand,
    friendCommand
)

client.addHandler(
    ...loginHandlers,
    ...friendHandlers
)
