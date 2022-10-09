import * as fs from "fs"
import conf from "./config.js"

export const commands = {}
export const events = {}

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