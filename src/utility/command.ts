import readline from "readline";

interface ICommandValue {
    run: (
        command: string[],
        resolve: (value: { from: string; value: string } | null | PromiseLike<{ from: string; value: string } | null>) => void,
        reject: (reason?: any) => void
    ) => void;
    data?: {
        help: {
            description: string;
            args?: {
                [k: string]: string;
            };
            alias?: string[];
        };
        [k: string]: any;
    };
};

interface ICommand {
    label?: string;
    commands: { [k: string]: ICommandValue };
    noHelp?: boolean;
    noForceLowercase?: boolean;
    preAction?: () => void;
}

export class Command {
    label: string;
    commands: { [k: string]: ICommandValue };
    aliases: { [k: string]: { target: string } };
    noHelp: boolean;
    noForceLowercase: boolean;
    preAction: () => void;
    constructor(args: ICommand) {
        this.label = args.label ?? "(Type 'help' to show help) ";
        this.commands = args.commands;
        this.noHelp = args.noHelp ?? false;
        this.noForceLowercase = args.noForceLowercase ?? false;
        this.preAction = args.preAction ?? function(){};
        let registeredAliases: { [k: string]: { target: string } } = {}
        for (const [key, value] of Object.entries(this.commands)) {
            if (key.length === 0) {
                throw new Error("The length of command should be at least 1 character")
            }
            if (key.split(" ").length !== 1) {
                throw new Error("Space character is not allowed. Please remove it")
            }
            if (key.toLowerCase() !== key && !this.noForceLowercase) {
                throw new Error("Command name should be lowercased")
            }
            if (!this.noHelp) {
                if (value.data === undefined) {
                    throw new Error(`'data' property of command '${key}' should be defined unless you set 'noHelp' property to true`)
                } else {
                    const { alias: aliases } = value.data.help;
                    if (aliases !== undefined) {
                        for (const alias of aliases) {
                            if (alias.length === 0) {
                                throw new Error("The length of alias should be at least 1 character")
                            }
                            if (alias.split(" ").length !== 1) {
                                throw new Error("Space character is not allowed. Please remove it")
                            }
                            if (alias.toLowerCase() !== alias && !this.noForceLowercase) {
                                throw new Error("Alias name should be lowercased")
                            }
                            if (Object.keys(this.commands).includes(alias)) {
                                throw new Error(`Collision between registered command and alias '${alias}' of command '${key}'. Please remove duplicate`)
                            }
                            if (Object.keys(registeredAliases).includes(alias)) {
                                throw new Error(`Collision between registered alias of command '${registeredAliases[alias].target}' and alias '${alias}' of command '${key}'. Please remove duplicate`)
                            }
                            registeredAliases = { ...registeredAliases, [alias]: { target: key } }
                        }
                    }
                }
            }
        }
        this.aliases = registeredAliases;
    }
    async execute(rl: readline.Interface) {
        await this.preAction();
        const command = (await prompt(rl, this.label)).split(" ");
        return new Promise<{ from: string; value: string } | null>((resolve, reject) => {
            if (command.length === 0) {
                reject();
                return;
            }

            if (!this.noForceLowercase) {
                command[0] = command[0].toLowerCase();
            }

            if (command[0] === "help" && !this.noHelp) {
                this.help(rl, command, resolve, reject);
                return;
            }

            const targetCommand = this.commands[command[0]]
            const targetAlias = this.aliases[command[0]]

            if (targetCommand === undefined && targetAlias === undefined) {
                reject(this.noHelp ? `'${command[0]}' is not a valid command.` : `'${command[0]}' is not a valid command. Type 'help' to show help.`);
                return;
            }

            if (targetCommand !== undefined) {
                targetCommand.run(command, resolve, reject);
                return;
            } else {
                this.commands[targetAlias.target].run(command, resolve, reject);
            }
        });
    }

    help(
        rl: readline.Interface,
        command: string[],
        resolve: (value: { from: string; value: string } | null) => void,
        reject: (reason?: any) => void
    ) {
        if (command.length === 1 || (command[1] = this.noForceLowercase ? command[1] : command[1].toLowerCase()) === "help") {
            console.log("\n\n====================\n[HELP]\n");
            for (const [key, value] of Object.entries(this.commands)) {
                if (value.data === undefined) {
                    reject("")
                    return;
                }
                console.log(`'${key}' - ${value.data.help.description}`);
            }
            console.log("Type 'help <command>' to get further information.");
            prompt(rl, "\n\nType Enter to continue...").then(() => resolve(null));
        } else {
            if (!this.noForceLowercase) {
                command[1] = command[1].toLowerCase();
            }
            const targetCommand = this.commands[command[1]]
            const targetAlias = this.aliases[command[1]]
            let target = targetCommand;
            let targetKey = command[1]

            if (targetCommand === undefined && targetAlias === undefined) {
                reject(`'${command[1]}' is not a valid command. Type 'help' to show help.`);
                return;
            }

            if (targetCommand === undefined) {
                target = this.commands[targetAlias.target]
                targetKey = targetAlias.target
            }


            if (target.data === undefined) {
                reject("")
                return;
            }
            const { alias, description, args } = target.data.help;
            console.log("\n\n====================");
            console.log(`[${targetKey.toUpperCase()}]`);
            console.log(
                `Usage: ${targetKey}${
                    args !== undefined
                        ? Object.keys(args)
                              .map((arg) => ` <${arg}>`)
                              .join("")
                        : ""
                }`
            );
            alias !== undefined ? console.log(`Alias: ${alias.join(", ")}`) : null;
            console.log(`${description}`);
            if (args !== undefined) {
                for (const [key, value] of Object.entries(args)) {
                    console.log(`${key} - ${value}`);
                }
            }
            prompt(rl, "\n\nType Enter to continue...").then(() => resolve(null));
        }
    }
}

export const prompt = async (rl: readline.Interface, question: string) => {
    const output = await new Promise<string>((resolve, reject) => {
        rl.question(`${question}`, (answer) => {
            resolve(answer);
        });
    })
    return output;
}

export const confirm = async (rl: readline.Interface, question: string, truthy: string[] = ["y", "Y"]) => {
    const output = await new Promise<string>((resolve, reject) => {
        rl.question(`${question}`, (answer) => {
            resolve(answer);
        });
    })
    return truthy.includes(output);
}