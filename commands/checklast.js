import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import { toxicityEmbed } from "../modules/toxicityEmbed.js"

export const exec = async (interaction) => {
    let em, lastMsg, forceEphemeral
    try {
        em = await toxicityEmbed(interaction.channel.lastMessage.content)
    } catch(e) {
        em = new EmbedBuilder().setTitle("Failed to get last message").setFooter({ text: "Is it blank?" })
        forceEphemeral = true
    }
    await interaction.reply({ embeds: [em], ephemeral: forceEphemeral ? true : interaction.options.getBoolean("ephemeral") })
}

export const data = new SlashCommandBuilder()
    .setName('checklast')
    .setDescription('Checks toxicity of the last message in the current channel')
    .addBooleanOption(option =>
        option.setName('ephemeral')
            .setDescription('Should the reply only be visible to you?')
            .setRequired(false))