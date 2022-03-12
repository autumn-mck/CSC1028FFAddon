var tabUrl;
const apiUrl = "http://localhost";

function tabChangedListener(activeInfo) {
	// TODO: Does not cover switching windows? Look into how seperate windows works.
	console.log("\n\n\nTab switched!");
	let tabId = activeInfo.tabId;
	if (tabId === browser.tabs.TAB_ID_NONE) {
		console.log("Ignoring tab that is not browser tab!");
		return;
	}
	let tab = browser.tabs.get(tabId);
	tab.then(onTabSwitch, onError);
}

async function onTabSwitch(tabInfo) {
	let url = tryParseUrl(tabInfo.url);

	if (!url || !url.hostname) {
		return;
	}

	console.log(`Tab switched to ${url.hostname}`);

	tabUrl = url;

	checkHostname(url.hostname);
	//checkDataForUrl(url);
}

async function checkDataForUrl(url) {
	browser.storage.local.get(url.hostname + url.pathname).then(checkLocalData, onError);
}

async function checkHostname(hostname) {
	browser.storage.local.get(hostname).then(async function (item) {
		if (Object.keys(item).length) {
			let data = item[hostname];
			hasHostnameData(data);
		} else {
			let data = await fetchExtHostnameData(hostname);
			let storage = { [hostname]: data };
			browser.storage.local.set(storage);
			hasHostnameData(data);
		}
	}, onError);
}

async function fetchExtHostnameData(hostname) {
	let similarweb,
		dnsLookup,
		phishingData = await Promise.all([
			queryUrl(`${apiUrl}:10130/${hostname}`),
			queryUrl(`${apiUrl}:10131/${hostname}`),
			queryUrl(`${apiUrl}:10132/${hostname}`),
		]);
	return {
		similarweb: similarweb,
		dns: dnsLookup,
		phishingData: phishingData,
	};
}

async function hasHostnameData(data) {
	// Do what?
}

async function queryUrl(url) {
	console.log(`About to request ${url}.`);

	let res = await fetchAsync(url);
	console.log(res);
	return res;
}

function checkLocalData(item) {
	if (Object.keys(item).length) hasLocalData(item);
	else fetchRemoteData();
}

async function hasLocalData(item) {
	console.log("Got local data!");
	let url = tabUrl;
	let urlStr = url.hostname + url.pathname;
	let data = item[urlStr];
	console.log(data);

	let title = browser.i18n.getMessage("notificationTitle");
	let content = browser.i18n.getMessage("notificationContent", data.host);

	browser.notifications.create({
		type: "basic",
		iconUrl: browser.extension.getURL("icons/icon.png"),
		title: title,
		message: content,
	});
}

async function fetchRemoteData() {
	console.log("No local data found!");

	let url = tabUrl;
	let urlStr = url.hostname + url.pathname;
	try {
		let req = "http://localhost:8080?url=" + urlStr;

		console.log(`About to request ${req}.`);
		let res = await fetchAsync(req);
		console.log(res);

		let storage = { [urlStr]: res };
		console.log("About to store data...");
		console.log(storage);
		browser.storage.local.set(storage);

		let title = browser.i18n.getMessage("notificationTitle");
		let content = browser.i18n.getMessage("notificationContent", urlStr);
		browser.notifications.create({
			type: "basic",
			iconUrl: browser.extension.getURL("icons/icon.png"),
			title: title,
			message: content,
		});
	} catch (ex) {
		console.log(ex);
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

async function fetchAsync(url) {
	let response = await fetch(url);
	let data = await response.json();
	return data;
}

async function onError(error) {
	console.log(`Error: ${error}`);
}

browser.tabs.onActivated.addListener(tabChangedListener);
