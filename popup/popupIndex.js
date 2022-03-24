console.log("Popup opened!");
let divContainer = document.getElementById("table");
let table = document.createElement("table");
divContainer.appendChild(table);

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
			let data = JSON.parse(item[url.hostname]);

			// Display the data
			for (let key in data) {
				tableData(key, data[key]);
			}

			str = "Data found!";
		} else {
			str = "No data found!";
		}

		// Parse and display the data, if found
		let paragraph = document.getElementById("rawJson");
		paragraph.textContent = str;
	}, onError);
}

/**
 * Query the given URL and add its results to the table
 * @param {string} name The name of the data source
 * @param {string} url The URL to query
 * @returns The result of the query
 */
async function tableData(name, data) {
	// Add a new row at the bottom of the table
	let tr = table.insertRow(-1);

	// Add a new cell to the new row, containing the name out the data source
	let cell1 = tr.insertCell(-1);
	cell1.innerHTML = name;

	// Add a seccond cell to the new row, containing the data
	let cell2 = tr.insertCell(-1);
	let res = data;
	// If the data is in an array, hide it behind a details element so it doesn't take up too much room
	if (Array.isArray(res) && res.length > 0) {
		let str = `\n<details>\n<summary>Expand to see all ${name}</summary>\n<p>\n`;

		// Add all items to the details element
		for (let i = 0; i < res.length; i++) {
			str += `${res[i].subdomain}.${res[i].domainWithoutSuffix}.${res[i].publicSuffix}<br />\n`;
		}
		str += "</p>\n</details>";
		cell2.innerHTML = str;
	}
	// Otherwise just display the raw JSON for now
	else cell2.innerHTML = JSON.stringify(res);
	return res;
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
