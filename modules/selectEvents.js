import { EmbedBuilder } from "discord.js"
import * as db from "./pg.js"
import conf from "../config.js"

export const selEvents = {
    setSensitivity: async (interaction) => {
        await db.updateRecord(
            "UserSettings",
            interaction.user.id,
            { warnSensitivity: parseFloat(interaction.values[0]) },
            {
                enableWarn: conf.defaultUserSettings.enableWarn,
                warnSensitivity: parseFloat(interaction.values[0])
            }
        )
        const em = new EmbedBuilder().setTitle("Set.")
        await interaction.update({ embeds: [em], content: "", components: [] })
    }
}