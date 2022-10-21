import { EmbedBuilder, PermissionsBitField } from "discord.js"
import { model, encode, encoder, client } from "../index.js"
import * as db from "../modules/pg.js"

// stores toxicity and author of last few messages 
// in each channel in each server
let chnCache = {}
// stores time of warning per guild, per member
let warnCache = {}
// stores toxicity levels for last few messages per
// author in each server
let authCache = {}

export const exec = async (message) => {
    if (!message.content || message.author.id == client.user.id) return
    const xPredict = await encode(encoder, [message.content])
    const prediction = (await model.predict(xPredict).data())[0]
    const id = message.author.id
    const gid = message.guild.id
    const cid = message.channel.id
    const now = new Date()

    // initialize objects if they don't exist
    if (!chnCache[gid]) chnCache[gid] = {}
    if (!chnCache[gid][cid]) chnCache[gid][cid] = []
    if (!warnCache[gid]) warnCache[gid] = {}
    if (!authCache[gid]) authCache[gid] = {}
    if (!authCache[gid][id]) authCache[gid][id] = []

    // pushes message author ID and toxicity to end of cache
    chnCache[gid][cid].push([id, prediction, now])
    authCache[gid][id].push(prediction)

    // removes first element if size is too big
    if (chnCache[gid][cid].length > 7) chnCache[gid][cid].shift()
    if (authCache[gid][id].length > 7) authCache[gid][id].shift()

    // removes all older elements so that a user isn't counted
    // as "involved" in a conversation if their last msg is old
    chnCache[gid][cid] = chnCache[gid][cid].filter(i => diffMins(i[2], now) < 5)

    const messages = chnCache[gid][cid]
    // create arrays, one with user IDs which are at index
    // 0, and one with toxicity levels which are at index 1
    let IDs = []
    let tValues = []
    messages.forEach(message => {
        IDs.push(message[0])
        tValues.push(message[1])
    });
    // calculate an average for these messages
    const tAvg = tValues.reduce((a, b) => a + b) / tValues.length;

    // calculate an average toxicity for this msg author, default
    // to 0 if there are less than a few messages from them so that
    // automod will not apply
    const authMsgs = authCache[gid][id]
    const aAvg = authMsgs.length > 4 ? authMsgs.reduce((a, b) => a + b) / authMsgs.length : 0

    console.log(message.channel.name, tAvg, aAvg, prediction)

    // get all records for each member involved
    // in the last few messages
    await db.query(`SELECT * FROM UserSettings WHERE id=ANY($1::varchar[])`, [IDs], async (err, result) => {
        if (err) return console.error(err)
        for (const i of result.rows) {
            // check if the user has enabled warnings
            // then warn if the average crosses their set
            // threshold
            if (i.enablewarn == true && tAvg > parseFloat(i.warnsensitivity)) {
                const guild = message.guild
                const member = await guild.members.fetch(i.id)
                const mid = member.user.id

                // don't warn if the user to be warned has sent the message
                if (message.member.user.id == mid) return

                const channel = message.channel

                // if it's been 15 minutes since the last warning,
                // don't warn again
                if (warnCache[gid][mid] && diffMins(warnCache[gid][mid], now) < 15) return

                const em = new EmbedBuilder()
                    .setTitle(`Hello ${message.author.username}!`)
                    .setDescription(`I suggest taking a break from the conversation in **${channel.name}** in **${guild.name}**.`)
                    .setFooter({ text: "I am telling you this since you have enabled warnings. Disable them by using /set warn" })
                member.send({ embeds: [em] })    
                
                warnCache[gid][mid] = now
            }
        }
    })

    await db.query(`SELECT * FROM GuildSettings WHERE id=$1`, [gid], async (err, result) => {
        if (err) return console.error(err)
        const settings = result.rows[0]
        if (settings) {
            // check if the server has enabled automod
            if (settings.enableautomod == true && aAvg > settings.modsensitivity) {
                if (message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return

                if (message.member.moderatable) {
                    await message.member.send(`Hello ${message.author.username}, you've been kicked from ${message.guild.name} for repeated toxicity.`)
                    message.member.kick()
                        .then(() => {
                            message.channel.send(`Sayonara ${message.author.username}, I don't think you'll be missed.`)
                        })
                        .catch(() =>
                            message.channel.send("I can't kick this member. Either I don't have permissions or I'm below their role."))
                }
                // clear the user's cache
                authCache[gid][id] = []
            }

            // check if the server has enabled auto deletion
            if (settings.enableautodelete == true && prediction > settings.deletesensitivity) {
                if (message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return

                message.delete()
                    .then(() => {
                        if (settings.enabledeletemsg)
                            message.channel.send(`${message.author.username}, your message has triggered automatic deletion.`)
                    })
                    .catch(() => message.channel.send("Error deleting message: I likely don't have permission."))
            }
        }
    })

    await db.query(`SELECT * FROM Users WHERE id=$1`, [id], function(err, result) {
        if (result.rows[0]) {
            const msgCount = result.rows[0].msgcount+1
            const avgToxic = (result.rows[0].avgtoxic*(msgCount-1) + prediction)/msgCount
            db.query(`UPDATE Users SET msgcount=$1, avgtoxic=$2 WHERE id=$3`, [msgCount, avgToxic, id], (err) => {
                if(err) console.log(err)
            })
        } else {
            db.query(`INSERT INTO Users (id, avgtoxic, msgcount) VALUES ($1, $2, $3)`, [id, prediction, 1], (err) => {
                if(err) console.log(err)
            })
        }
    })
}

// returns difference between 2 dates in minutes
const diffMins = (d1, d2) => { return Math.abs(d1 - d2) / 60000 }