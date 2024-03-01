import fs from "fs";
import readline from "readline";
import { shuffle, shuffleEntry, shuffleHome } from "./utility/shuffle.js";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const home = () => {
    return new Promise<string>((resolve, reject) => {
        rl.question("\n\n====================\n\nWelcome to Util-Bowl!\nThere is options:\n\n1. directory shuffle\n\nWhat would you like to execute? (Enter a number, q to exit) ", (answer) => {
            resolve(answer)
        });
    })
}

const main = async () => {
    let loop = true;
    await home().then(async (input: string) => {
        switch (input) {
            case "1": await shuffleEntry(rl)
                break;
            case "q":
                loop = false;
                break;
            default:
                break;
        }
        return;
    });
    if (loop) await main();
    rl.close();
}

main();