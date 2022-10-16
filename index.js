import * as use from "@tensorflow-models/universal-sentence-encoder"
import * as tf from "@tensorflow/tfjs-node-gpu"
import * as fs from "fs"
import { Client, GatewayIntentBits, REST, Routes } from "discord.js"
import { config } from "dotenv"
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { saveData } from "./modules/readData.js"
import { trainModel } from "./modules/trainModel.js"
import { selEvents } from "./modules/selectEvents.js"
import conf from "./config.js"

// load .env as environment variables
config()

export const encode = async (encoder, data) => {
    const sentences = data.map(t => t.toLowerCase())
    const embeddings = await encoder.embed(sentences)
    return embeddings;
}
// tf expects a file:// path
const modelPath = `file://${dirname(fileURLToPath(import.meta.url))}${conf.modelPath}`

export let model
export let encoder
export let client
// stores functions for each command and event
export const commands = {}
export const events = {}

// run saveData with a blank object
saveData({}).then(async data => {
    encoder = await use.load()

    // try to load saved model. if error, the model
    // couldn't be loaded and likely doesn't exist
    try {
        model = await tf.loadLayersModel(modelPath+"/model.json")
        console.log("Using saved model")
    } catch(e) {
        // train and save a new model
        const xTrain = await encode(encoder, Object.keys(data))
        const yTrain = tf.tensor1d(Object.values(data).map(c => c))
        model = await trainModel(xTrain, yTrain)
        try {
            await model.save(modelPath)
        } catch(e) {
            console.log("Couldn't save model")
            console.error(e)
            console.log(conf)
        }
    }


    // loads all command and event files into objects
    const commandFiles = fs.readdirSync(`.${conf.commandsPath}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        import(`.${conf.commandsPath}/${file}`).then(command => {
            let data = command.data
            if (!data) data = { name: command.name, type: command.type }
            commands[file.replace(".js", "")] = { exec: command.exec, data: data };
        })
    }
    const eventFiles = fs.readdirSync(`.${conf.eventsPath}`).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        import(`.${conf.eventsPath}/${file}`).then(event => {
            events[file.replace(".js", "")] = event.exec;
        })
    }


    // create a client with intents (required so the
    // bot can have access to some properties)
    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessageReactions
        ]
    })
    client.login(process.env.TOKEN)
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    client.on("ready", async () => {
        console.log(`Bot ready as ${client.user.tag}`)

        // stores a data object for each command
        let slashCommands = []
        for (const key of Object.keys(commands)) {
            slashCommands.push(commands[key].data)
        }

        // upload command data to Discord so that the
        // commands can be registered
        try {
            console.log(`Started loading ${slashCommands.length} application commands`)

            const data = await rest.put(
                Routes.applicationCommands(client.user.id.toString()),
                { body: slashCommands },
            )

            console.log(`Successfully loaded ${data.length} application commands`)
        } catch (error) {
            console.error(error)
        }

        // for each event that was loaded from the event
        // files, attach an event listener to the client
        for (const event in events) {
            client.on(event, ctx => events[event](ctx))
        }
    })
})