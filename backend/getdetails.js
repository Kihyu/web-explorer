import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Holt den Titel einer URL
 * @param {string} url 
 * @returns {string} title
 */
export async function getPageDetails(url) {
  try {
    const res = await axios.get(url, {
      headers: {
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0 Safari/537.36"
      }
    });
    const $ = cheerio.load(res.data);

    const title = $("title").text() || url; // if no tilte, return url
    return { url, title };
  } catch (err) {
    return { url, title: "Unknown: " + classifyLink(url).type};
  }
}

function classifyLink(url) {
  if (url.startsWith("mailto:")) {
    return { type: "email"};
  }
  if (url.startsWith("tel:")) {
    return { type: "phone"};
  }
  return { type: "unkown", value: url };
}
