import { EmbedBuilder } from "discord.js"
import * as db from "../modules/pg.js"
import * as userContext from "./checkUserContext.js"

export const exec = async (interaction) => {
    return await userContext.exec(interaction, true)
}

export const name = "Check Privately"
export const type = 2