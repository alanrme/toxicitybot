import { EmbedBuilder } from "discord.js"
import { model, encode, encoder } from "../index.js"

export const toxicityEmbed = async (input) => {
    const xPredict = await encode(encoder, [input])
    const prediction = await model.predict(xPredict).data()
    let long = false
    if (input.length > 200) {
        long = true
        input = `${input.substring(0, 200)}...`
    }
    let em = new EmbedBuilder()
        .addFields(
            { name: "Input", value: input },
            { name: "Toxicity", value: `Toxicity: **${prediction*100}%**`, inline: true }
        )
    if (long) em.setFooter({ text: 'It might show a cut off input, but your entire input is counted by the ML model.' })
    return em
}