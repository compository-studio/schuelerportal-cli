const {
	fetchWithCookies,
	ensureLoggedIn,
	getXsrfToken,
} = require("./schule-api-session-module");

async function getTimeTableAPI(username, password) {
	await ensureLoggedIn(username, password);
	const xsrfToken = getXsrfToken();

	const apiResponse = await fetchWithCookies(
		"https://api.schueler.schule-infoportal.de/hugyvat/api/vertretungsplan",
		{
			method: "GET",
			headers: {
				Accept: "application/json, text/plain, */*",
				"x-xsrf-token": xsrfToken,
				Referer: "https://schueler.schule-infoportal.de/",
			},
		}
	);

	const data = await apiResponse.json();
	return data;
}

module.exports = {
	getTimeTableAPI(username, password) {
        return getTimeTableAPI(username, password);
    }
};
