import { commands } from "../loader.js"
import { encoder } from "../index.js"

export const exec = (interaction) => {
    if (interaction.isSelectMenu())
        return selEvents[interaction.component.customId](interaction)

    let cmdName
    switch (interaction.commandType) {
        case 2:
            cmdName = interaction.commandName.toLowerCase() + "UserContext"
            break
        case 3: // for message context menu interactions
            cmdName = interaction.commandName.toLowerCase() + "MsgContext"
            break
        default: // default to slash command
            cmdName = interaction.commandName
    }
    const cmd = commands[cmdName]
    if (cmd) cmd.exec(interaction, encoder)
}