import fs from "fs";
import readline from "readline";
import { prompt, confirm } from "./command.js"

export const shuffleHome = async (rl: readline.Interface) => {
    const location = await prompt(rl, "\n\n====================\n\n[Directory Shuffle]\nWhat directory would you like to shuffle? (:q to exit) ")
    return new Promise<string>(async (resolve, reject) => {
        if (location === ":q") {
            reject("QUIT")
            return;
        }
        if (location === "") {
            reject()
            return;
        }
        const decide = await confirm(rl, `\nTarget path is ${location}. Are you sure? (y/n) `);
        if (decide) {
            resolve(location)
        } else {
            reject()
        }
        return;
    })
}

export const shuffleEntry = async (rl: readline.Interface) => {
    let message = "";
    try {
        const location = await shuffleHome(rl);
        message = await shuffle(location);
    } catch (e) {
        if (e === "QUIT") {
            return;
        }
        message = e as string;
    }

    message !== undefined ? console.log(message) : undefined;
    await shuffleEntry(rl);
};

export const shuffle = (location: string) => {
    return new Promise<string>(async (resolve, reject) => {
        fs.readdir(location, async (err, files) => {
            const filenames: (string | null)[] = [];
            const extensions: string[] = [];
            const shuffledFilenames = await new Promise<(string | null)[]>((innerResolve, innerReject) => {
                if (err) {
                    reject(`Path ${location} is not a valid path.`);
                    return;
                }

                files = files.filter((file) => !fs.lstatSync(`${location}/${file}`).isDirectory());
                for (const file of files) {
                    if (file.indexOf(".") === -1) {
                        filenames.push(null);
                        extensions.push(file);
                        continue;
                    }

                    const split = file.split(".");
                    const last = split.pop() as string;
                    filenames.push(split.join());
                    extensions.push(last);
                }

                const shuffledFilenames = filenames
                    .map((value) => ({ value, sort: Math.random() }))
                    .sort((a, b) => a.sort - b.sort)
                    .map(({ value }) => value);

                innerResolve(shuffledFilenames);
            });
            for await (const file of files) {
                fs.copyFileSync(`${location}/${file}`, `${location}/${file}.tmp`);
                fs.unlinkSync(`${location}/${file}`);
            }
            for await (const [idx, filename] of filenames.entries()) {
                fs.rename(
                    `${location}/${filename === null ? extensions[idx] : `${filename}.${extensions[idx]}`}.tmp`,
                    `${location}/${shuffledFilenames[idx] === null ? extensions[idx] : `${shuffledFilenames[idx]}.${extensions[idx]}`}`,
                    () => {}
                );
            }

            resolve(`Path ${location} is successfully shuffled.`);
            return;
        })
    })
}