import fs from "fs";
import path from "path";
import readline from "readline";
import { shuffle } from "./shuffle.js";
import { Command, confirm } from "./command.js";
import { fileboomEntry, fileboomHome } from "./fileboom.js";

export const explorerEntry = async (rl: readline.Interface, location: string, message: string | null = null, commandSession?: Command) => {
    let loop = true;
    if (commandSession === undefined) {
        commandSession = new Command({
            preAction: () => explorer(location, message),
            commands: {
                "quit": {
                    run: (command, resolve, reject) => {
                        reject("QUIT")
                    },
                    data: {
                        help: {
                            description: "Show a list of help",
                            alias: ["q"]
                        }
                    }
                },
                "cd": {
                    run: (command, resolve, reject) => {
                        const directory = command.toSpliced(0, 1).join(" ");
                        try {
                            fs.accessSync(directory, fs.constants.R_OK | fs.constants.W_OK)
                            if (fs.lstatSync(directory).isDirectory()) {
                                resolve({ from: "cd", value: directory });
                            } else {
                                reject(`Path ${directory} is not a directory. Failed to change directory`)
                            }
                        } catch {
                            reject(`Unable to access ${directory}. Failed to change directory`)
                        }
                    },
                    data: {
                        help: {
                            description: "Change to targeted directory",
                            args: {
                                "directory": "targeted directory"
                            }
                        }
                    }
                },
                "shuffle": {
                    run: (command, resolve, reject) => {
                        (async () => {
                            const directory = command.toSpliced(0, 1).join(" ");
                            const decide = await confirm(rl, `\nTarget path is ${directory === "" ? process.cwd(): directory}. Are you sure? (y/n) `);
                            if (decide) {
                                const message = await shuffle(directory === "" ? process.cwd(): directory)
                                await(() => new Promise<void>((resolve) => setTimeout(resolve, 100)))();
                                reject(message);
                            } else {
                                resolve(null);
                            }
                        })();
                    },
                    data: {
                        help: {
                            description: "Shuffle directory",
                            args: {
                                "directory": "targeted directory"
                            }
                        }
                    }
                },
                "fileboom": {
                    run: (command, resolve, reject) => {
                        (async () => {
                            const directory = command.toSpliced(0, 1).join(" ");
                            const message = await fileboomEntry(rl, { type: "reinput", from: "locationSure", misc: directory === "" ? process.cwd(): directory }, "external");
                            await(() => new Promise<void>((resolve) => setTimeout(resolve, 100)))();
                            reject(message);
                        })();
                    },
                    data: {
                        help: {
                            description: "File-booming!",
                            args: {
                                "directory": "targeted directory"
                            }
                        }
                    }
                }
            }
        })
    }
    try {
        const output = await commandSession.execute(rl)
        if (output !== null && output.from === "cd") {
            process.chdir(output.value as string);
            location = process.cwd();
        }
        message = null;
    } catch (err) {
        if (err === "QUIT") {
            loop = false;
        }
        message = err as string;
    }

    if (loop) await explorerEntry(rl, location, message)
}

export const explorer = (location: string, message: string | null = null) => {
    return new Promise<void>(async (resolve, reject) => {
        fs.readdir(location, (err, files) => {
            console.log("\n\n====================")
            let maxLength = 0;
            const rows: [string, string][] = [];
            rows.push(["< file >", "< type >\t\t< date >"])
            for (const file of files) {
                let type = null;
                let date = "";
                try {
                    const stat = fs.lstatSync(file)
                    type = stat.isDirectory() ? "Directory" : "File";
                    date = stat.mtime.toLocaleString()
                } catch(e) { }
                if (maxLength < file.length) maxLength = file.length;
                rows.push([`${file}`, `${type === null ? "Unavailable" : `${type}\t\t${date}`}`])
            }
            for (const row of rows) {
                const offset = maxLength - row[0].length;
                console.log(`${row[0]}${" ".repeat(offset) + "\t"}${row[1]}`);
            }
            console.log("====================")
            message !== null ? console.log(message) : undefined;
            resolve()
        })
    })
}