#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { program } = require("commander");
const os = require("os");
const readline = require("readline");
const getHausaufgabenAPI = require("./get-hausaufgaben").getHausaufgabenAPI;
const getTimeTableAPI = require("./get-stundenplan").getStundenplanAPI;

const CONFIG_PATH = path.join(
	os.homedir(),
	".schuelerportal-cli",
	"config.json"
);

function getCharsThatNeedToBeSpaces(string, maxLength = 50) {
	if (typeof string !== "string") {
		string = String(string);
	}
	const length = string.length;
	const charsThatNeedToBeSpaces = maxLength - length;
	return charsThatNeedToBeSpaces > 0
		? " ".repeat(charsThatNeedToBeSpaces)
		: "";
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
			const borderSymbol = "–";

			return borderSymbol.repeat(beginLength + fixedLength);
		};

		if (index === 0) {
			console.log(
				"\n  " + calculateTopBorderLength("| Subject     | ", 51)
			);
		}

		console.log(
			`  | Homework #${index + 1}   ` +
				getCharsThatNeedToBeSpaces("") +
				"|"
		);
		console.log("  " + calculateTopBorderLength("| Subject     | ", 51));
		console.log(
			`  | Subject     | ${hw.subject?.long || "Unknown"}` +
				getCharsThatNeedToBeSpaces(hw.subject?.long || "Unknown") +
				"|"
		);
		console.log(
			`  | Teacher     | ${hw.teacher || "Unknown"}` +
				getCharsThatNeedToBeSpaces(hw.teacher || "Unknown") +
				"|"
		);
		console.log(
			`  | Assigned    | ${hw.date || "No date"}` +
				getCharsThatNeedToBeSpaces(hw.date || "No date") +
				"|"
		);
		console.log(
			`  | Due At      | ${hw.due_at || "No due date"}` +
				getCharsThatNeedToBeSpaces(hw.due_at || "No due date") +
				"|"
		);
		console.log(
			`  | Homework    | ${hw.homework || "No description"}` +
				getCharsThatNeedToBeSpaces(hw.homework || "No description") +
				"|"
		);
		console.log(
			`  | Completed   | ${hw.completed ? "Yes" : "No"}` +
				getCharsThatNeedToBeSpaces(hw.completed ? "Yes" : "No") +
				"|"
		);
		console.log(
			`  | Files       | ${
				hw.files?.length > 0 ? hw.files.length + " attached" : "None"
			}` +
				getCharsThatNeedToBeSpaces(
					hw.files?.length > 0
						? hw.files.length + " attached"
						: "None"
				) +
				"|"
		);
		console.log(
			`  | Substitute  | ${hw.substitute ? "Yes" : "No"}` +
				getCharsThatNeedToBeSpaces(hw.substitute ? "Yes" : "No") +
				"|"
		);
		console.log("  " + calculateTopBorderLength("| Subject     | ", 51));
	});
}

function printTimeTableList(timetable) {
	if (!Array.isArray(timetable)) {
		if (typeof timetable === "string") {
			try {
				timetable = JSON.parse(timetable);
			} catch (error) {
				console.error("Error parsing timetable data:", error.message);
				return;
			}
		}
	}

	const calculateTopBorderLength = (begin, fixed) => {
		const beginLength = begin.length;
		const fixedLength = fixed;
		const borderSymbol = "–";
		return borderSymbol.repeat(beginLength + fixedLength);
	};

	if (!Array.isArray(timetable.data)) {
		console.log("No timetable entries found.");
		return;
	}

	timetable.data.forEach((entry, entryIndex) => {
		if (entryIndex === 0) {
			console.log(
				"\n  " + calculateTopBorderLength("| Missing Teacher  | ", 46)
			);
		}

		const date = new Date(entry.date);
		const isToday = date.toDateString() === new Date().toDateString();
		const isTomorrow =
			date.toDateString() ===
			new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

		let dayString;
		if (isToday) {
			dayString = "Today";
		} else if (isTomorrow) {
			dayString = "Tomorrow";
		} else {
			dayString = "Sometime in the future";
		}

		const nodd =
			entry.room === "NO33" ||
			entry.reason === "entfällt" ||
			entry.room === "Ersatz";
		const entfallText = nodd ? "No Lesson" : entry.room;

		console.log(
			`  | Entry #${entryIndex + 1}           ` +
				getCharsThatNeedToBeSpaces("", 45) +
				"|"
		);
		console.log(
			"  " + calculateTopBorderLength("| Missing Teacher  | ", 46)
		);
		console.log(
			`  | Day              | ${dayString}` +
				getCharsThatNeedToBeSpaces(dayString, 45) +
				"|"
		);
		console.log(
			`  | Hour             | ${entry.hour || "Unknown"}` +
				getCharsThatNeedToBeSpaces(entry.hour || "Unknown", 45) +
				"|"
		);
		console.log(
			`  | Room             | ${entfallText}` +
				getCharsThatNeedToBeSpaces(entfallText, 45) +
				"|"
		);
		console.log(
			`  | Missing Teacher  | ${entry.abs_teacher || "-"}` +
				getCharsThatNeedToBeSpaces(entry.abs_teacher || "-", 45) +
				"|"
		);
		console.log(
			`  | Subject          | ${entry.uf || "-"}` +
				getCharsThatNeedToBeSpaces(entry.uf || "-", 45) +
				"|"
		);

		if (!nodd) {
			console.log(
				`  | Substitute       | ${
					entry.vertr_teacher || "No teacher"
				}` +
					getCharsThatNeedToBeSpaces(
						entry.vertr_teacher || "No teacher",
						45
					) +
					"|"
			);
		}

		console.log(
			"  " + calculateTopBorderLength("| Missing Teacher  | ", 46)
		);
	});
}

const ensureConfigExists = () => {
	if (!fs.existsSync(CONFIG_PATH)) {
		fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
		fs.writeFileSync(CONFIG_PATH, JSON.stringify({}));
		console.log("Configuration file created at:", CONFIG_PATH);
		console.log(
			`Please run 'portal config' to set your username and password or edit the config file manually (Located at ${CONFIG_PATH}).`
		);
	}
};

program
	.name("schuelerportal-cli")
	.description("Schuelerportal API CLI")
	.version("0.0.1")
	.alias("portal");

program
	.command("homework")
	.description("fetches the homeworks with your given log-in data")
	.alias("hw")
	.action(async () => {
		ensureConfigExists();
		const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

		if (!config.username || !config.password) {
			console.error(
				"Please set your username and password in the config file."
			);
			return;
		}

		try {
			const homework = await getHausaufgabenAPI(
				config.username,
				config.password
			);
			printHomeworkList(homework);
		} catch (error) {
			console.error("Error fetching homework:", error.message);
		}
	});

program
	.command("timetable")
	.description(
		"fetches todays or tomorrows timetable with your given log-in data"
	)
	.alias("tt")
	.action(async () => {
		ensureConfigExists();
		const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

		if (!config.username || !config.password) {
			console.error(
				"Please set your username and password in the config file."
			);
			return;
		}

		try {
			const timetable = await getTimeTableAPI(
				config.username,
				config.password
			);
			printTimeTableList(timetable);
		} catch (error) {
			console.error("Error fetching timetable:", error.message);
		}
	});

program
	.command("config")
	.description("configure the portal")
	.action(async () => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		ensureConfigExists();
		const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

		const username = await new Promise((resolve) => {
			rl.question(
				`Username (${config.username || "not set"}): `,
				resolve
			);
		});

		const password = await new Promise((resolve) => {
			rl.question(
				`Password (${config.password ? "***" : `not set`}): `,
				resolve
			);
		});

		rl.close();

		const newConfig = {
			username: username || config.username,
			password: password || config.password,
		};

		fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
		console.log("Configuration saved successfully.");
	});

program.parse();
