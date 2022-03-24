var tabUrl;
// The URL where the API is hosted
const apiUrl = "http://localhost";

// Handle the selected tab being changed
function tabChangedListener(activeInfo) {
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

// Handle the user navigating between pages
function tabUpdatedListener(tabId, changeInfo) {
	// Only make query once page has loaded
	if (changeInfo.status === "complete") {
		// Ignore browser tabs like about:config, etc
		if (tabId === browser.tabs.TAB_ID_NONE) {
			console.log("Ignoring tab that is not browser tab!");
			return;
		}

		// Get the tab from its tab ID
		let tab = browser.tabs.get(tabId);
		tab.then(onTabSwitch, onError);
	}
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
			let data = await Promise.resolve(fetchExtHostnameData(hostname));
			// Cache the data
			let storage = { [hostname]: JSON.stringify(data) };
			browser.storage.local.set(storage);

			hasHostnameData(data);
		}
	}, onError);
}

/**
 * Fetch the data
 */
async function fetchExtHostnameData(hostname) {
	return new Promise((resolve) => {
		Promise.all([
			queryUrl(`${apiUrl}:10130/${hostname}`),
			queryUrl(`${apiUrl}:10131/${hostname}`),
			queryUrl(`${apiUrl}:10132/${hostname}`),
			queryUrl(`${apiUrl}:10133/${hostname}`),
			queryUrl(`${apiUrl}:10134/${hostname}`),
			queryUrl(`${apiUrl}:10135/${hostname}`),
			queryUrl(`${apiUrl}:10136/${hostname}`),
		]).then((arr) => {
			console.log(arr);
			let [phishingData, similarweb, dnsLookup, archiveDate, geolocation, subdomains, stackshare] = arr;

			let res = {
				"Similarweb rank": similarweb,
				"DNS Lookup": dnsLookup,
				"Phishing/malware data": phishingData,
				"Earliest archive date": archiveDate,
				Subdomains: subdomains,
				"Stackshare data": stackshare,
			};
			resolve(res);
		});
	});
}

async function hasHostnameData(data) {
	// Do what? Update icon/show notification if malware or something?
}

/**
 * Fetch JSON from the given URL
 */
async function queryUrl(url) {
	try {
		// Fetch the URL
		let res = await fetch(url);
		// Parse the JSON
		let data = await res.json();
		// Return the data
		return data;
	} catch (ex) {
		console.log(`ERROR: ${ex}`);
		return null;
	}
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
browser.tabs.onUpdated.addListener(tabUpdatedListener, { properties: ["status"] });
