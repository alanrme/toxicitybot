import { EmbedBuilder } from "discord.js"
import { toxicityEmbed } from "../modules/toxicityEmbed.js"

export const exec = async (interaction) => {
    let em, content, forceEphemeral
    try {
        content = interaction.targetMessage.content
        em = await toxicityEmbed(content)
    } catch(e) {
        console.error(e)
        em = new EmbedBuilder().setTitle("Failed to get message content").setFooter({ text: "Is it blank?" })
        forceEphemeral = true
    }
    await interaction.reply({ embeds: [em], ephemeral: forceEphemeral ? true : interaction.options.getBoolean("ephemeral") })
}

export const name = "Check"
export const type = 3