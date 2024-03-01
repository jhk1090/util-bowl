import fs from "fs";
import readline from "readline";

export const shuffleHome = (rl: readline.Interface) => {
    return new Promise<string>((resolve, reject) => {
        rl.question("\n\n====================\n\n[Directory Shuffle]\nWhat directory would you like to shuffle? ", (answer) => {
            resolve(answer)
        });
    })
}

export const shuffleEntry = async (rl: readline.Interface) => {
    let loop = true;
    await shuffleHome(rl)
            .then(async (location: string) => {
                return shuffle(location);
            })
            .then(() => {
                loop = false;
                return;
            })
            .catch(() => {
                return;
            });
    if (loop) await shuffleEntry(rl);
};

export const shuffle = (location: string) => {
    return new Promise<void>(async (resolve, reject) => {
        fs.readdir(location, (err, files) => {
            if (err) {
                console.log(`Path ${location} is not a valid path.`)
                reject(err)
                return
            }
            
            files = files.filter(file => !fs.lstatSync(`${location}/${file}`).isDirectory())
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
                fs.copyFileSync(`${location}/${file}`, `${location}/${file}.tmp`)
                fs.unlinkSync(`${location}/${file}`)
            }
            for (const [idx, filename] of filenames.entries()) {
                fs.renameSync(`${location}/${filename === null ? extensions[idx] : `${filename}.${extensions[idx]}`}.tmp`, `${location}/${shuffledFilenames[idx] === null ? extensions[idx] : `${shuffledFilenames[idx]}.${extensions[idx]}`}`)
            }

            console.log(`Path ${location} is successfully shuffled.`)
            resolve();
            return;
        })
    })
}