import { commands } from "../index.js"
import { selEvents } from "../modules/selectEvents.js"

export const exec = (interaction) => {
    if (interaction.isSelectMenu())
        return selEvents[interaction.component.customId](interaction)

    let cmdName
    switch (interaction.commandType) {
        case 2:
            cmdName = interaction.commandName.replace(/\s/g, "").toLowerCase() + "UserContext"
            break
        case 3: // for message context menu interactions
            cmdName = interaction.commandName.replace(/\s/g, "").toLowerCase() + "MsgContext"
            break
        default: // default to slash command
            cmdName = interaction.commandName
    }
    const cmd = commands[cmdName]
    if (cmd) cmd.exec(interaction)
}