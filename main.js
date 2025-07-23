#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { program } = require("commander");
const os = require("os");
const readline = require("readline");
const getHausaufgabenAPI = require("./get-hausaufgaben").getHausaufgabenAPI;
const getTimeTableAPI = require("./get-stundenplan").getStundenplanAPI;

const CONFIG_PATH = path.join(os.homedir(), ".schuelerportal-cli", "config.json");

function getCharsThatNeedToBeSpaces(string) {
    const length = string.length;
    const maxLength = 50; 
    const charsThatNeedToBeSpaces = maxLength - length;
    return charsThatNeedToBeSpaces > 0 ? " ".repeat(charsThatNeedToBeSpaces) : "";
}

function printHomeworkList(homework) {
    if (!Array.isArray(homework) || homework.length === 0) {
    console.log("No homework found.");
    return;
    }

    homework.forEach((hw, index) => {
        const calculateTopBorderLength = (begin, fixed) => {
            const beginLength = begin.length;
            const fixedLength = fixed;
            const borderSymbol = "–"

            return borderSymbol.repeat(beginLength + fixedLength);
        }

        if (index === 0) {
            console.log(calculateTopBorderLength("| Subject     | ", 51));
        }

        console.log(`| Homework #${index + 1}  | ` + getCharsThatNeedToBeSpaces("") + "|");
        console.log(`| Subject     | ${hw.subject?.long || "Unknown"}` + getCharsThatNeedToBeSpaces(hw.subject?.long || "Unknown") + "|");
        console.log(`| Teacher     | ${hw.teacher || "Unknown"}` + getCharsThatNeedToBeSpaces(hw.teacher || "Unknown") + "|");
        console.log(`| Assigned    | ${hw.date || "No date"}` + getCharsThatNeedToBeSpaces(hw.date || "No date") + "|");
        console.log(`| Due At      | ${hw.due_at || "No due date"}` + getCharsThatNeedToBeSpaces(hw.due_at || "No due date") + "|");
        console.log(`| Homework    | ${hw.homework || "No description"}` + getCharsThatNeedToBeSpaces(hw.homework || "No description") + "|");
        console.log(`| Completed   | ${hw.completed ? "Yes" : "No"}` + getCharsThatNeedToBeSpaces(hw.completed ? "Yes" : "No") + "|");
        console.log(`| Files       | ${hw.files?.length > 0 ? hw.files.length + " attached" : "None"}` + getCharsThatNeedToBeSpaces(hw.files?.length > 0 ? hw.files.length + " attached" : "None") + "|");
        console.log(`| Substitute  | ${hw.substitute ? "Yes" : "No"}` + getCharsThatNeedToBeSpaces(hw.substitute ? "Yes" : "No") + "|");
        console.log(calculateTopBorderLength("| Subject     | ", 51));
    });
}

function printTimeTableList(timetable) {
    if (!Array.isArray(timetable)) {
        try {
            timetable = JSON.parse(timetable);
        } catch (error) {
            console.error("Error parsing timetable data:", error.message);
            return;
        }
    }
    
    timetable.forEach((tt, index) => {
        const calculateTopBorderLength = (begin, fixed) => {
            const beginLength = begin.length;
            const fixedLength = fixed;
            const borderSymbol = "–"

            return borderSymbol.repeat(beginLength + fixedLength);
        }

        if (index === 0) {
            console.log(calculateTopBorderLength("| Missing Teacher  | ", 51));
        }

        const date = new Date(tt.data.date);
        const isToday = date.toDateString() === new Date().toDateString();
        const isTomorrow = date.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

        if (isToday) {
            dayString = "Today"
        } else if (isTomorrow) {
            dayString = "Tomorrow"
        } else {
            dayString = "Sometime in the future"
        }
        
        const nodd = tt.data.room === "NO33" || tt.data.room === "Entfall" || tt.data.room === "Ersatz";
        
        const entfallText = nodd ? "No Lesson" : tt.data.room;
        
        console.log(`| Entry #${index + 1}` + getCharsThatNeedToBeSpaces("") + "|");
        console.log(`| Day              | ${dayString}` + getCharsThatNeedToBeSpaces(dayString) + "|");
        console.log(`| Hour             | ${tt.data.hour || "Unknown"}` + getCharsThatNeedToBeSpaces(tt.data.hour || "Unknown") + "|");
        console.log(`| Room             | ${entfallText}` + getCharsThatNeedToBeSpaces(entfallText) + "|");
        console.log(`| Missing Teacher  | ${tt.data.abs_teacher || "-"}` + getCharsThatNeedToBeSpaces(tt.data.abs_teacher || "-") + "|");
        console.log(`| Subject          | ${tt.data.uf || "-"}` + getCharsThatNeedToBeSpaces(tt.data.uf || "-") + "|");

        if (!nodd) {
            console.log(`| Substitute       | ${tt.data.vertr_teacher || "No teacher"}` + getCharsThatNeedToBeSpaces(tt.data.vertr_teacher || "No teacher") + "|");
        }

        console.log(calculateTopBorderLength("| Missing Teacher  | ", 51));
    });
}


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
            printHomeworkList(homework);
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
            printTimeTableList(); 
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

//jetz nur noch das json stringyfy dingsda mit dem function call printHomeworkList(homework); ersetzen
program.parse();