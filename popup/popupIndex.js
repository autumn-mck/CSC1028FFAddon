console.log("Popup opened!");

async function main() {
	let tabs = await browser.tabs.query({ active: true, currentWindow: true });
	let tab = tabs[0];
	let url = tryParseUrl(tab.url);
	console.log(tab);

	browser.storage.local.get(url.hostname).then(async function (item) {
		let str = "";
		if (Object.keys(item).length) {
			let data = item[url.hostname];
			str = JSON.stringify(data);
		} else {
			str = "No data found!";
		}

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

main();
