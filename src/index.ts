import fs from "fs";
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

let input = "";

rl.on("line", (line) => {
    input = line;
    rl.close();
});

rl.on("close", () => {
    fs.readdir(input, (err, files) => {
        if (err) {
            console.log(`Path ${input} is not a valid path.`);
            return;
        }
        
        files = files.filter(file => !fs.lstatSync(input + "/" + file).isDirectory());
        const filenames = [];
        const extensions = [];
        for (const file of files) {
            if (file.indexOf(".") === -1) {
                filenames.push(null)
                extensions.push(file)
                continue;
            }

            const split = file.split(".")
            const last = split.pop()
            filenames.push(split.join())
            extensions.push(last)
        }

        const shuffledFilenames = filenames
            .map(value => ({value, sort: Math.random()}))
            .sort((a, b) => a.sort - b.sort)
            .map(({value}) => value)

        for (const file of files) {
            fs.copyFileSync(`${input}/${file}`, `${input}/${file}.tmp`)
            fs.unlinkSync(`${input}/${file}`)
        }
        for (const [idx, filename] of filenames.entries()) {
            fs.renameSync(`${input}/${filename === null ? extensions[idx] : `${filename}.${extensions[idx]}`}.tmp`, `${input}/${shuffledFilenames[idx] === null ? extensions[idx] : `${shuffledFilenames[idx]}.${extensions[idx]}`}`)
        }
    });
});
