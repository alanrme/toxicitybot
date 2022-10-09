import { SlashCommandBuilder } from "discord.js"
import { toxicityEmbed } from "../modules/toxicityEmbed.js"

export const exec = async (interaction) => {
    const em = await toxicityEmbed(interaction.options.getString("input"))
    await interaction.reply({ embeds: [em], ephemeral: interaction.options.getBoolean("ephemeral") })
}

export const data = new SlashCommandBuilder()
    .setName('check')
    .setDescription('Checks toxicity of text')
    .addStringOption(option =>
        option.setName('input')
            .setDescription('Text')
            .setRequired(true))
    .addBooleanOption(option =>
        option.setName('ephemeral')
            .setDescription('Should the reply only be visible to you?')
            .setRequired(false))