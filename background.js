var tabUrl;
// The URL where the API is hosted
const apiUrl = "http://localhost";

function tabChangedListener(activeInfo) {
	// TODO: Does not cover switching windows? Look into how seperate windows works.
	console.log("\n\n\nTab switched!");
	let tabId = activeInfo.tabId;
	// Ignore browser tabs like about:config, etc
	if (tabId === browser.tabs.TAB_ID_NONE) {
		console.log("Ignoring tab that is not browser tab!");
		return;
	}

	// Get the tab from its tab ID
	let tab = browser.tabs.get(tabId);
	tab.then(onTabSwitch, onError);
}

async function onTabSwitch(tabInfo) {
	// If the tab does not yet have a URL or does not have a hostname, for whatever reason, ignore it.
	let url = tryParseUrl(tabInfo.url);
	if (!url || !url.hostname) {
		return;
	}

	console.log(`Tab switched to ${url.hostname}`);

	tabUrl = url;

	// Query the details for the hostname
	checkHostname(url.hostname);
}

/**
 * Query and cache data for the given hostname
 */
async function checkHostname(hostname) {
	// Check the data has not already been cached
	browser.storage.local.get(hostname).then(async function (item) {
		if (Object.keys(item).length) {
			// If the data is already cached, it doesn't need to be fetched again
			// TODO: Should cache expire after a while?
			let data = item[hostname];
			hasHostnameData(data);
		} else {
			// Fetch the data
			let data = await fetchExtHostnameData(hostname);
			// Cache the data
			let storage = { [hostname]: data };
			browser.storage.local.set(storage);

			hasHostnameData(data);
		}
	}, onError);
}

/**
 * Fetch the data
 */
async function fetchExtHostnameData(hostname) {
	let similarweb,
		dnsLookup,
		phishingData,
		archiveDate,
		subdomains,
		stackshare = await Promise.all([
			queryUrl(`${apiUrl}:10130/${hostname}`),
			queryUrl(`${apiUrl}:10131/${hostname}`),
			queryUrl(`${apiUrl}:10132/${hostname}`),
			queryUrl(`${apiUrl}:10133/${hostname}`),
			queryUrl(`${apiUrl}:10135/${hostname}`),
			queryUrl(`${apiUrl}:10136/${hostname}`),
		]);
	return {
		similarweb: similarweb,
		dns: dnsLookup,
		phishingData: phishingData,
		archiveDate: archiveDate,
		subdomains: subdomains,
		stackshare: stackshare,
	};
}

async function hasHostnameData(data) {
	// Do what? Update icon/show notification if malware or something?
}

/**
 * Fetch JSON from the given URL
 */
async function queryUrl(url) {
	console.log(`About to request ${url}.`);

	// Fetch the URL
	let res = await fetch(url);
	// Parse the JSON
	let data = await res.json();
	console.log(data);
	// Return the data
	return data;
}

/**
 * Try to parse the URL
 * @param {string} urlStr The string to be parsed
 * @returns {URL} The parsed result
 */
function tryParseUrl(urlStr) {
	try {
		return new URL(urlStr);
	} catch {
		return null;
	}
}

async function onError(error) {
	console.log(`Error: ${error}`);
}

browser.tabs.onActivated.addListener(tabChangedListener);
