import { JSDOM, VirtualConsole } from "jsdom";
import { isURL } from "$lib/utils/isUrl";
import type { WebSearchSource } from "$lib/types/WebSearch";

export default async function searchWebLocal(query: string): Promise<WebSearchSource[]> {
	const abortController = new AbortController();
	setTimeout(() => abortController.abort(), 10000);

	const htmlString = await fetch(
		"https://www.baidu.com/s?wd=" + query,
		{ 
			signal: abortController.signal, 
			headers: {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}
		}
	)
		.then((response) => response.text())
		.catch();

	const virtualConsole = new VirtualConsole();
	virtualConsole.on("error", () => {}); // No-op to skip console errors.
	const document = new JSDOM(htmlString ?? "", { virtualConsole }).window.document;

	// get all links
	const links = document.querySelectorAll("a");
	if (!links.length) throw new Error(`webpage doesn't have any "a" element`);

	// take url that start wirth /url?q=
	// and do not contain google.com links
	// and strip them up to '&sa='
	const linksHref = Array.from(links)
		.filter((el) => el.href?.startsWith("http://www.baidu.com/link?url="))
		.map((el) => {
			const link = el.href;
			return link;
			// return link.slice("/link?url=".length, link.indexOf("&sa="));
		})
		.filter(isURL);

	// remove duplicate links and map links to the correct object shape
	return [...new Set(linksHref)].map((link) => ({ link }));
}
