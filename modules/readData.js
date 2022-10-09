import * as fs from "fs"
import * as readline from "readline"

export async function saveData (data) {
    // classification is used during ML training
    const files = [
        { path: "./rawdata/nontoxic.txt", classification: 0 },
        { path: "./rawdata/toxic.txt", classification: 1 }
    ]

    await files.forEach(async file => {
        const fileStream = fs.createReadStream(file.path);

        // crlfDelay recognizes CR LF ('\r\n') as a single line break
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        // for each line in the file
        for await (const line of rl) {
            data[line] = file.classification
        }
    })

    return data
}