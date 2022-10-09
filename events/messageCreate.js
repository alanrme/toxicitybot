import { model, encode, encoder } from "../index.js"
import * as db from "../modules/pg.js"

export const exec = async (message) => {
    if (!message.content) return
    const xPredict = await encode(encoder, [message.content])
    const prediction = (await model.predict(xPredict).data())[0]
    const id = message.author.id

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