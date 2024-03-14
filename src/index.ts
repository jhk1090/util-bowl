import fs from "fs";
import readline from "readline";
import { shuffleEntry } from "./utility/shuffle.js";
import { explorerEntry } from "./utility/explorer.js";
import path from "path";
import { Command } from "./utility/command.js";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const main = async () => {
    let loop = true;
    const session = new Command({
        noHelp: true,
        label: "\n\n====================\n\nWelcome to Util-Bowl!\nThere is options:\n\n1. Integrated Explorer\n2. Directory Shuffle\n\nWhat would you like to execute? (Enter a number, q to exit) ",
        commands: {
            "1": {
                run: async (c, res, rej) => {
                    await explorerEntry(rl, path.resolve());
                    res(null);
                },
            },
            "2": {
                run: async (c, res, rej) => {
                    await shuffleEntry(rl);
                    res(null);
                },
            },
            q: {
                run: (c, res, rej) => {
                    loop = false;
                    res(null);
                },
            },
        },
    });
    try {
        await session.execute(rl);
    } catch {}
    if (loop) await main();
    rl.close();
}

main();