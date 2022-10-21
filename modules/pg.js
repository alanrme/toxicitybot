// pg is a commonjs package so you need this workaround to import
import pkg from 'pg'
const { Pool } = pkg
import { config } from "dotenv"
import conf from "../config.js"

config()
// pools will use environment variables for connection info
const pool = new Pool()

export const query = async (text, params, callback) => {
    return await pool.query(text, params, callback)
}

export const getClient = async (callback) => {
    await pool.connect((err, client, done) => {
        callback(err, client, done)
    })
}

// props will be like { key: value, key2: value2, ... }
// defProps is for default values if the record is being added
export const updateRecord = async (table, id, props, defProps) => {
    await query(`SELECT * FROM ${table} WHERE id=$1`, [id], function(err, result) {
        if (err) console.error(err)
        
        // get keys of props as an array
        const propKeys = Object.keys(props)
        let setStrings = [] // will have ["key1=$1", "key2=$2" ...]
        let colStrings = [] // will have ["key1", "key2" ...]
        let indexStrings = [] // will have ["$1", "$2" ...]
        // for each key, add a string
        for (const i in propKeys) {
            setStrings.push(`${propKeys[i]}=$${i+2}`)
            colStrings.push(propKeys[i])
            indexStrings.push(`$${parseInt(i)+2}`)
        }

        // check if a record with id exists in this table, if not make one
        if (result.rows[0]) {
            // if the value needs to be incremented/decremented, replace all values in prop
            // that are equal to "++" with the (old value + 1), same with "--" but decrement
            /*
            const propValues = Object.values(props).map(v => {
                switch (v) {
                    case "++":
                        v = result.rows[0][propKeys[propValues.indexOf(v)]] + 1
                        break
                    case "--":
                        v = result.rows[0][propKeys[propValues.indexOf(v)]] - 1
                        break
                    default:
                        v
                }
            })
            */
            
            // join the array with ", " so the result is like "key=$3, key2=$4, ..."
            // then join table and id with the values of props and use it for the SQL values
            // so that key and key2 match to index 3 and 4 of the array, and thus match up to
            // value and value2 (after the table name and id)
            query(
                `UPDATE ${table} SET ${setStrings.join(", ")} WHERE id=$1`, [id].concat(Object.values(props)),
                (err) => {
                    if(err) console.error(err)
                }
            )
        } else {
            // join them separately because different SQL syntax, and id is
            // always first
            query(
                `INSERT INTO ${table} (id, ${colStrings.join(", ")}) VALUES ($1, ${indexStrings.join(", ")})`,
                [id].concat(Object.values(props)),
                (err) => {
                    if(err) console.log(err)
                }
            )
        }
    })
}

// create tables if they don't exist
// constraint needs a name, format "CONSTRAINT <name>"
await query(`
CREATE TABLE IF NOT EXISTS Users (
    id VARCHAR(19) NOT NULL,
    avgtoxic FLOAT(12) DEFAULT -1,
    msgcount INT DEFAULT 0,
    PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS UserSettings (
    id VARCHAR(19) NOT NULL,
    enablewarn BOOL DEFAULT ${conf.defaultUserSettings.enableWarn},
    warnsensitivity FLOAT(2) DEFAULT ${conf.defaultUserSettings.warnSensitivity},
    CONSTRAINT FK_Users_Settings FOREIGN KEY (id)     
        REFERENCES Users (id)
);
CREATE TABLE IF NOT EXISTS GuildSettings (
    id VARCHAR(19) NOT NULL,
    enableautomod BOOL DEFAULT ${conf.defaultGuildSettings.enableAutoMod},
    enableautodelete BOOL DEFAULT ${conf.defaultGuildSettings.enableAutoDelete},
    enabledeletemsg BOOL DEFAULT ${conf.defaultGuildSettings.enableDeleteMsg},
    modsensitivity FLOAT(2) DEFAULT ${conf.defaultGuildSettings.modSensitivity},
    deletesensitivity FLOAT(2) DEFAULT ${conf.defaultGuildSettings.deleteSensitivity}
);
`)