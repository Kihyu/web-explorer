import express from "express";
import cors from "cors";
import { crawlPage } from "./crawler.js";
import { getPageDetails } from "./getdetails.js";

const app = express();
app.use(cors());

app.get("/crawl", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });

  try {
    const links = await crawlPage(url);
    res.json({ url, links });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Details einer URL
app.get("/details", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });

  try {
    const details = await getPageDetails(url);
    res.json(details);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NEUER ENDPOINT: Favicon-Proxy
app.get("/favicon", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });

  try {
    // Standard-Favicon-Pfad
    const faviconUrl = `${url.replace(/\/$/, "")}/favicon.ico`;

    const response = await fetch(faviconUrl);
    if (!response.ok) {
      return res.status(404).json({ error: "Favicon not found" });
    }

    const buffer = await response.arrayBuffer();
    res.set("Content-Type", response.headers.get("content-type") || "image/x-icon");
    res.set("Access-Control-Allow-Origin", "*"); // Important for CORS
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: "Error fetching favicon: " + err.message });
  }
});

app.listen(3001, () => console.log("Backend running on http://localhost:3001"));
