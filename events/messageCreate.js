import { EmbedBuilder } from "discord.js"
import { model, encode, encoder, client } from "../index.js"
import * as db from "../modules/pg.js"

// stores toxicity and author of last few messages 
// in each channel in each server
let cache = {}
// stores time of warning per guild, per member
let warnCache = {}

export const exec = async (message) => {
    if (!message.content || message.author.id == client.user.id) return
    const xPredict = await encode(encoder, [message.content])
    const prediction = (await model.predict(xPredict).data())[0]
    const id = message.author.id
    const gid = message.guild.id
    const cid = message.channel.id
    const now = new Date()

    // initialize objects if they don't exist
    if (!cache[gid]) cache[gid] = {}
    if (!cache[gid][cid]) cache[gid][cid] = []
    if (!warnCache[gid]) warnCache[gid] = {}
    // pushes message author ID and toxicity to end of cache
    cache[gid][cid].push([id, prediction, now])

    // removes first element if size is too big
    if (cache[gid][cid].length > 7) {
        cache[gid][cid].shift()
    }
    // removes all older elements so that a user isn't counted
    // as "involved" in a conversation if their last msg is old
    cache[gid][cid] = cache[gid][cid].filter(i => diffMins(i[2], now) < 5)

    const messages = cache[gid][cid]
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
    console.log(message.channel.name, tAvg)

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
                const channel = message.channel
                const mid = member.user.id
                // if it's been 15 minutes since the last warning,
                // don't warn again
                if (warnCache[gid][mid] && diffMins(warnCache[gid][mid], now) < 15) return
                const em = new EmbedBuilder()
                    .setTitle(`Hello ${member.user.tag}! I suggest taking a break from the conversation in ${channel.name} in ${guild.name}.`)
                    .setFooter({ text: "I am telling you this since you have enabled warnings. Disable them by using /set warn" })
                member.send({ embeds: [em] })    
                warnCache[gid][mid] = now
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