import fs from "fs";
import readline from "readline";
import { prompt, confirm } from "./command.js"

export const fileboomHome = async (rl: readline.Interface, event?: IEvent, origin?: "internal" | "external") => {
    return new Promise<{ location: string, amount: number }>(async (resolve, reject) => {
        let location = "";
        console.log(`\n\n====================\n\n[Fileboom]`);
        if (event !== undefined && event.message !== undefined) {
            console.log(event.message)
        }

        if (event === undefined) {
            event = { type: "reinput", from: "location" }
        }

        if (event.from !== "locationSure" && event.from !== "amount") {
            location = await prompt(rl, "What directory would you like to boom? (:q to exit) ")
            if (location === ":q") {
                reject({ type: "quit" })
                return;
            }
            if (location === "") {
                reject({ type: "reinput", from: "location", message: `Path ${location} is not a valid path.` })
                return;
            }
        }

        if (event.misc !== undefined) {
            location = event.misc;
        }

        if (event.from !== "amount") {
            const decide = await confirm(rl, `Target path is ${location}. Are you sure? (y/n) `)
            if (!decide) {
                if (origin === "external") {
                    reject({ type: "quit" })
                } else {
                    reject({ type: "reinput", from: "location" })
                }
                return;
            }
        }

        const amount = await prompt(rl, `How much file you want to boom with? (Type number, :q to ${origin === "external" ? "quit" : "cancel"}) `)
        if (amount === ":q") {
            if (origin === "external") {
                reject({ type: "quit" })
            } else {
                reject({ type: "reinput", from: "location", message: "Cancelled the task." })
            }
            return;
        }
        if (!Number.isInteger(Number(amount)) || Number(amount) <= 0) {
            reject({ type: "reinput", from: "amount", misc: location, message: "Invalid amount. Please enter again. (range from 1)" })
            return;
        }

        resolve({ location, amount: Number(amount) })
        return;
    })
}

interface IEvent {
    type: "quit" | "reinput" | "message" | null;
    from?: "location" | "locationSure" | "amount";
    misc?: string;
    message?: string;
}

export const fileboomEntry = async (rl: readline.Interface, event?: IEvent, origin?: "external" | "internal") => {
    try {
        const input = await fileboomHome(rl, event, origin);
        const result = await fileboom(input, origin);
        if (origin === "external") {
            return result;
        }
        event = { type: "message", message: result }
    } catch (e: unknown) {
        event = e as IEvent;
        if (event.type === "quit") {
            return;
        }
    }

    await fileboomEntry(rl, event, origin)
}

export const fileboom = (input: { location: string, amount: number }, origin?: "external" | "internal") => {
    return new Promise<string>(async (resolve, reject) => {
        fs.readdir(input.location, (err, files) => {
            if (err) {
                if (origin === "external") {
                    resolve(`Path ${input.location} is not a valid path.`)
                } else {
                    reject({ type: "reinput", from: "location", message: `Path ${input.location} is not a valid path.`})
                }
                return;
            }
            for (let i = 0; i < input.amount; i++) {
                fs.writeFileSync(`${input.location}/BOOM${i+1}.txt`, "!!!FILEBOOM!!!");
            }
            resolve(`You successfully boomed ${input.location}`)
            return;
        })
    })
}