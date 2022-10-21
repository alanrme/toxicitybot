import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, PermissionFlagsBits } from "discord.js"
import * as db from "../modules/pg.js"
import conf from "../config.js"

export const exec = async (interaction) => {
    const setEm = new EmbedBuilder().setTitle("Set.")
    switch (interaction.options.getSubcommandGroup()) {
        case "autodelete":
            switch (interaction.options.getSubcommand()) {
                case "enable":
                    await db.updateRecord(
                        "GuildSettings",
                        interaction.guildId,
                        { enableAutoDelete: interaction.options.getBoolean("enable") }
                    )
                    interaction.reply({ embeds: [setEm], ephemeral: true })
                    break
                case "sensitivity":
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new SelectMenuBuilder()
                                .setCustomId('setAutoDelSensitivity')
                                .setPlaceholder('Nothing selected')
                                .addOptions(
                                    {
                                        label: 'Low',
                                        value: '0.82',
                                    },
                                    {
                                        label: 'Medium',
                                        value: '0.75',
                                    },
                                    {
                                        label: 'High',
                                        value: '0.68',
                                    },
                                ),
                        )
                    await interaction.reply({ content: 'Choose sensitivity:', components: [row], ephemeral: true });
                    break
                case "notify":
                    await db.updateRecord(
                        "GuildSettings",
                        interaction.guildId,
                        { enableDeleteMsg: interaction.options.getBoolean("enable") }
                    )
                    interaction.reply({ embeds: [setEm], ephemeral: true })
                    break
            }
            break
        case "automod":
            console.log("re")
            break
    }
}

export const data = new SlashCommandBuilder()
    .setName('configure')
    .setDescription('Configure server wide settings (for administrators)')
    .addSubcommandGroup(group => group
        .setName("autodelete")
        .setDescription("Configure automatic deletion")
        .addSubcommand(subcommand => subcommand
            .setName("enable")
            .setDescription("Enable or disable auto deletion")
            .addBooleanOption(option => option
                .setName('enable')
                .setDescription("Enable or disable")
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName("notify")
            .setDescription("Enable or disable announcing in chat if a message is deleted")
            .addBooleanOption(option => option
                .setName('enable')
                .setDescription("Enable or disable")
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName("sensitivity")
            .setDescription("Configure threshold before a message is deleted")
        )
    )
    .addSubcommandGroup(group => group
        .setName("automod")
        .setDescription("Configure automatic moderation")
        .addSubcommand(subcommand => subcommand
            .setName("enable")
            .setDescription("Enable or disable auto moderation")
            .addBooleanOption(option => option
                .setName('enable')
                .setDescription("Enable or disable")
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName("sensitivity")
            .setDescription("Configure threshold before a user is punished")
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)