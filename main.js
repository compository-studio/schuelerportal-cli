#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { program } = require("commander");
const os = require("os");
const readline = require("readline");
const getHausaufgabenAPI = require("./get-hausaufgaben").getHausaufgabenAPI;
const getTimeTableAPI = require("./get-stundenplan").getStundenplanAPI;

const CONFIG_PATH = path.join(os.homedir(), ".schuelerportal-cli", "config.json");

const ensureConfigExists = () => {
    if (!fs.existsSync(CONFIG_PATH)) {
        fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify({}));
        console.log("Configuration file created at:", CONFIG_PATH);
        console.log(`Please run 'portal config' to set your username and password or edit the config file manually (Located at ${CONFIG_PATH}).`);
    }
};

program.name("schuelerportal-cli").description("Schuelerportal API CLI").version("0.0.1").alias("portal");

program.command("homework")
    .description('fetches the homeworks with your given log-in data')
    .alias("hw")
    .action(async () => {
        ensureConfigExists();
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
        
        if (!config.username || !config.password) {
            console.error("Please set your username and password in the config file.");
            return;
        }

        try {
            const homework = await getHausaufgabenAPI(config.username, config.password);
            console.log(homework);
        } catch (error) {
            console.error("Error fetching homework:", error.message);
        }
    });

program.command("timetable")
    .description('fetches todays or tomorrows timetable with your given log-in data')
    .alias("tt")
    .action(async () => {
        ensureConfigExists();
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
        
        if (!config.username || !config.password) {
            console.error("Please set your username and password in the config file.");
            return;
        }

        try {
            const timetable = await getTimeTableAPI(config.username, config.password);
            console.log(timetable);
        } catch (error) {
            console.error("Error fetching timetable:", error.message);
        }
    })

program.command("config")
    .description('configure the portal')
    .action(async () => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        ensureConfigExists();
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

        const username = await new Promise(resolve => {
            rl.question(`Username (${config.username || 'not set'}): `, resolve);
        });

        const password = await new Promise(resolve => {
            rl.question(`Password (${config.password ? '***' : `not set`}): `, resolve);
        });

        rl.close();

        const newConfig = {
            username: username || config.username,
            password: password || config.password
        }

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
        console.log("Configuration saved successfully.");
    })

program.parse();