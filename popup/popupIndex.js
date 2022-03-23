console.log("Popup opened!");

async function main() {
	// Get the URL of the active tab
	let tabs = await browser.tabs.query({ active: true, currentWindow: true });
	let tab = tabs[0];
	let url = tryParseUrl(tab.url);
	console.log(tab);

	// Check local storage for related data
	// TODO: Should wait and display data when it is added if it's not initially present
	browser.storage.local.get(url.hostname).then(async function (item) {
		let str = "";
		if (Object.keys(item).length) {
			let data = item[url.hostname];
			str = JSON.stringify(data);
		} else {
			str = "No data found!";
		}

		// Parse and display the data, if found
		let paragraph = document.getElementById("rawJson");
		paragraph.textContent = str;
	}, onError);
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

// Run the main function
main().catch(console.error);
