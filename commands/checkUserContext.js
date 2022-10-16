import { EmbedBuilder } from "discord.js"
import * as db from "../modules/pg.js"

export const exec = async (interaction, forceEphemeral=false) => {
    await db.query(`SELECT * FROM Users WHERE id=$1`, [interaction.targetId], async (err, result) => {
        let em
        if (result.rows[0]) {
            const tag = interaction.targetUser.tag
            em = new EmbedBuilder()
                .addFields(
                    { name: "User", value: tag, inline: true },
                    { name: "Average Toxicity", value: `**${result.rows[0].avgtoxic*100}%**`, inline: true }
                )
                .setFooter({ text: `Calculated from ${result.rows[0].msgcount} messages from ${tag}` })
        } else {
            forceEphemeral = true
            em = new EmbedBuilder().setTitle("I've never seen a message with text from this person!")
        }
        await interaction.reply({ embeds: [em], ephemeral: forceEphemeral })
    })
}

export const name = "Check"
export const type = 2