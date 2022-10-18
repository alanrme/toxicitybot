import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder } from "discord.js"
import * as db from "../modules/pg.js"
import conf from "../config.js"

export const exec = async (interaction) => {
    const setEm = new EmbedBuilder().setTitle("Set.")
    switch (interaction.options.getSubcommand()) {
        case "warn":
            await db.updateRecord(
                "UserSettings",
                interaction.user.id,
                { enableWarn: interaction.options.getBoolean("enable") },
                {
                    enableWarn: interaction.options.getBoolean("enable"),
                    warnSensitivity: conf.defaultUserSettings.warnSensitivity
                }
            )
            interaction.reply({ embeds: [setEm], ephemeral: true })
            break
        case "sensitivity":
            const row = new ActionRowBuilder()
                .addComponents(
                    new SelectMenuBuilder()
                        .setCustomId('setSensitivity')
                        .setPlaceholder('Nothing selected')
                        .addOptions(
                            {
                                label: 'Low',
                                value: '0.44',
                            },
                            {
                                label: 'Medium',
                                value: '0.36',
                            },
                            {
                                label: 'High',
                                value: '0.28',
                            },
                        ),
                )
            await interaction.reply({ content: 'Choose sensitivity:', components: [row], ephemeral: true });
            break
    }
}

export const data = new SlashCommandBuilder()
    .setName('set')
    .setDescription('Edit your user-specific settings')
    .addSubcommand(subcommand => subcommand
        .setName("warn")
        .setDescription("Configure warnings to take a break")
        .addBooleanOption(option => option
            .setName('enable')
            .setDescription("Enable or disable")
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => subcommand
        .setName("sensitivity")
        .setDescription("Configure warning sensitivity")
    )