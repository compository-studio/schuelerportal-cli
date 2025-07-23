const tough = require("tough-cookie");
const fetchCookie = require("fetch-cookie").default;
const fetch = (...args) =>
	import("node-fetch").then((mod) => mod.default(...args));

const CookieJar = tough.CookieJar;
const jar = new CookieJar();
let xsrfToken = null;
let isLoggedIn = false;

async function fetchWithCookies(...args) {
	const realFetch = await fetch;
	return fetchCookie(realFetch, jar)(...args);
}

async function ensureLoggedIn() {
	if (isLoggedIn && xsrfToken) return xsrfToken;
	// Set school cookie
	await jar.setCookie(
		"schuelerportal_school=hugyvat; Path=/; Domain=schueler.schule-infoportal.de",
		"https://schueler.schule-infoportal.de"
	);

	// Initial GET to get XSRF token
	await fetchWithCookies(
		"https://api.schueler.schule-infoportal.de/hugyvat",
		{
			method: "GET",
			headers: {
				Accept: "text/html,application/xhtml+xml,application/xml",
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
				"Accept-Language": "en-US,en;q=0.9",
				Connection: "keep-alive",
				"Upgrade-Insecure-Requests": "1",
				"Cache-Control": "max-age=0",
				DNT: "1",
				"Sec-Fetch-Dest": "document",
				"Sec-Fetch-Mode": "navigate",
				"Sec-Fetch-Site": "same-origin",
				"sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": '"macOS"',
			},
		}
	);

	const cookies = await jar.getCookies(
		"https://schueler.schule-infoportal.de"
	);
	const xsrfCookie = cookies.find((c) => c.key === "XSRF-TOKEN");
	xsrfToken = xsrfCookie ? decodeURIComponent(xsrfCookie.value) : null;

	if (!xsrfToken) {
		throw new Error("Could not find XSRF-TOKEN in cookies");
	}

	// Login
	const loginResponse = await fetchWithCookies(
		"https://api.schueler.schule-infoportal.de/hugyvat/login",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				accept: "application/json, text/plain, */*",
				"accept-language": "en-US,en;q=0.9",
				"sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": '"macOS"',
				"sec-fetch-dest": "empty",
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "same-site",
				"x-xsrf-token": xsrfToken,
				Referer: "https://schueler.schule-infoportal.de/",
			},
			body: JSON.stringify({
				email: "",
				password: "",
			}),
		}
	);

	if (!loginResponse.ok) {
		throw new Error("Login failed");
	}

	isLoggedIn = true;
	return xsrfToken;
}

module.exports = {
	fetchWithCookies,
	ensureLoggedIn,
	getXsrfToken: () => xsrfToken,
	jar,
};
