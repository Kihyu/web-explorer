import axios from "axios";
import * as cheerio from "cheerio";

export async function crawlPage(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);

  const links = [];
  $("a").each((_, el) => {
    let href = $(el).attr("href");
    if (href && !href.startsWith("#")) {
      try {
        // relative → absolute umwandeln
        const absoluteUrl = new URL(href, url).href;
        links.push(absoluteUrl);
      } catch (e) {
        // falls es keine gültige URL ist, einfach ignorieren
      }
    }
  });

  // doppelte Einträge rausfiltern / wird nicht gefiltert
  return [...new Set(links)];
}
