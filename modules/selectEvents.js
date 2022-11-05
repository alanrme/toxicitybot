import { EmbedBuilder } from "discord.js"
import * as db from "./pg.js"
import conf from "../config.js"

const em = new EmbedBuilder().setTitle("Set.")

export const selEvents = {
    setSensitivity: async (interaction) => {
        await db.updateRecord(
            "UserSettings",
            interaction.user.id,
            { warnSensitivity: parseFloat(interaction.values[0]) }
        )
        await interaction.update({ embeds: [em], content: "", components: [] })
    },
    setAutoDelSensitivity: async (interaction) => {
        await db.updateRecord(
            "GuildSettings",
            interaction.guildId,
            { deleteSensitivity: parseFloat(interaction.values[0]) }
        )
        await interaction.update({ embeds: [em], content: "", components: [] })
    },
    setAutoModSensitivity: async (interaction) => {
        await db.updateRecord(
            "GuildSettings",
            interaction.guildId,
            { modSensitivity: parseFloat(interaction.values[0]) }
        )
        await interaction.update({ embeds: [em], content: "", components: [] })
    },
    setReactionSensitivity: async (interaction) => {
        await db.updateRecord(
            "GuildSettings",
            interaction.guildId,
            { reactionSensitivity: parseFloat(interaction.values[0]) }
        )
        await interaction.update({ embeds: [em], content: "", components: [] })
    }
}