import { model, encode, encoder, client } from "../index.js"
import * as db from "../modules/pg.js"

// stores toxicity of last few messages in each server and the participants
let cache = {}

export const exec = async (message) => {
    if (!message.content || message.author.id == client.user.id) return
    const xPredict = await encode(encoder, [message.content])
    const prediction = (await model.predict(xPredict).data())[0]
    const id = message.author.id
    const gid = message.guild.id
    const cid = message.channel.id

    if (!cache[gid]) cache[gid] = {}
    if (!cache[gid][cid]) cache[gid][cid] = []
    cache[gid][cid].push([id, prediction])
    // removes first element if size is too big
    if (cache[gid][cid].length > 7) cache[gid][cid].shift()
    
    for (const gid of Object.keys(cache)) {
        // create arrays with only and only user IDs
        // which are at index 0 and toxicity levels
        // which are at index 1
        const guild = cache[gid]
        for (const cid of Object.keys(guild)) {
            const channels = guild[cid]
            let IDs = []
            let tValues = []
            channels.forEach(message => {
                IDs.push(message[0])
                tValues.push(message[1])
            });
            const tAvg = tValues.reduce((a, b) => a + b) / tValues.length;
            console.log(tAvg)
            if (tAvg > 0.35) {
                const guild = await client.guilds.fetch(gid)
                const channel = await guild.channels.fetch(cid)
                channel.send("My friend.. conversation turning awry")
            }
        }
    }

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