const fs = require("fs");
const path = require("path");
const { Command } = require("commander");
const getHausaufgabenAPI = require("./get-hausaufgaben").getHausaufgabenAPI;

const program = new Command();
program
	.description("CLI for Schülerportal")
	.option("--homework", "Fetch homework")
	.option("--schedule", "Fetch class schedule");

program.parse(process.argv);
const options = program.opts();

// Load credentials from config
function loadCredentials(configPath = "schuelerportal.conf") {
	const fullPath = path.resolve(__dirname, configPath);
	if (!fs.existsSync(fullPath)) {
		throw new Error(
			`Missing config file: ${fullPath}. Please create it with email=... and password=...`
		);
	}

	const content = fs.readFileSync(fullPath, "utf-8");
	const credentials = {};
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || !trimmed.includes("=")) continue;
		const [key, value] = trimmed.split("=");
		credentials[key.trim()] = value.trim();
	}

	if (!credentials.email || !credentials.password) {
		throw new Error("Invalid config file: email or password is missing.");
	}

	return credentials;
}

// Patch login credentials into login.js
function injectCredentials(loginModule, credentials) {
	loginModule.__injectCredentials = () => ({
		email: credentials.email,
		password: credentials.password,
	});
}

async function fetchData(endpoint, label) {
	const res = await fetchWithCookies(
		`https://api.schueler.schule-infoportal.de/hugyvat/${endpoint}`,
		{
			method: "GET",
			headers: {
				Accept: "application/json",
				"x-xsrf-token": getXsrfToken(),
			},
		}
	);

	if (!res.ok) {
		throw new Error(`Failed to fetch ${label}: ${res.status}`);
	}

	const data = await res.json();
	console.log(`\n== ${label.toUpperCase()} ==`);
	console.log(JSON.stringify(data, null, 2));
}

async function main() {
	try {
		const credentials = loadCredentials();
		injectCredentials(require("./login"), credentials);

		await ensureLoggedIn();

		if (options.homework) {
			await fetchData("homework", "Homework");
		}

		if (options.schedule) {
			await fetchData("schedule", "Schedule");
		}

		if (!options.homework && !options.schedule) {
			console.log(
				"Please use at least one flag: --homework or --schedule"
			);
		}
	} catch (err) {
		console.error("Error:", err.message);
	}
}

main();
