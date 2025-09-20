const nodes = new Map();  // key = URL, value = Node-Objekt
const links = [];         // alle Kanten
const baseUrls = [];    // alle gecrawlte Basis-URLs
let cy;

// Event-Listener for Crawl-Button
document.getElementById("crawlBtn").addEventListener("click", async () => {

  let url = document.getElementById("urlInput").value;

  if (url.includes("https://") || url.includes("http://")) {
    // nothing to do
  } else if (url) {
    url = "https://" + url;
  }
  
  if (!url) {
    // alert("Please insert URL!");
    return;
  }

  try {
    // API call an /crawl
    const res = await fetch(`http://localhost:3001/crawl?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    data.links.forEach(link => addLink(data.url, link)); // Add links to global graph

    // Graph zeichnen
    drawGraph();

  } catch (err) {
    alert("Error while reading links: " + err.message);
  }
});

function addLink(sourceUrl, targetUrl) {
  // Falls Node noch nicht existiert → anlegen
  if (!nodes.has(sourceUrl)) {
    nodes.set(sourceUrl, { id: sourceUrl, inbound: 0, outbound: 0, position: null });
  }
  if (!nodes.has(targetUrl)) {
    nodes.set(targetUrl, { id: targetUrl, inbound: 0, outbound: 0, position: null });
  }
  if (!baseUrls.includes(sourceUrl)) {
    baseUrls.push(sourceUrl);
  }

  // Link hinzufügen
  if (!links.find(l => l.source === sourceUrl && l.target === targetUrl))
  {
    links.push({ source: sourceUrl, target: targetUrl });
  }
  
  // inbound/outbound updaten
  nodes.get(sourceUrl).outbound++;
  nodes.get(targetUrl).inbound++;
}


// SEHR WICHTIG!!!! FÜR ALGORITHMUS
// Function: Draw Graph with Cytoscape.js
// Function: Draw Graph with Cytoscape.js
function drawGraph() {
  const container = document.getElementById('graph');
  document.getElementById('details').innerHTML = '<h1>Details:</h1>'; // Details-Panel leeren

  // 1. Nodes in Cytoscape-Format umwandeln
  const cyNodes = Array.from(nodes.values()).map(node => ({
    data: { id: node.id, label: node.id },
    position: node.position || undefined   // gespeicherte Position verwenden
  }));

  // 2. Links in Cytoscape-Format umwandeln
  const cyEdges = links.map((link, i) => ({
    data: { id: 'e' + i, source: link.source, target: link.target }
  }));

  // Prüfen: gibt es bereits gespeicherte Positionen?
  const hasSavedPositions = Array.from(nodes.values()).some(n => n.position !== null);

  // Basis-Styles
  const styles = [
    {
      selector: 'node',
      style: {
        'background-color': '#0074D9',
        'width': 20,
        'height': 20,
        'font-size': 5,
        'overlay-opacity': 0,
        'border-width': 0
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#ccc',
        'target-arrow-color': '#ccc',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    }
  ];

  // Für jede Base-URL Spezial-Style hinzufügen
  baseUrls.forEach(baseUrl => {
    const ico = "http://localhost:3001/favicon?url=" + new URL(baseUrl).origin;

    styles.push({
      selector: `node[id = "${baseUrl}"]`, // Selektor für genau diese Node
      style: {
        'label': 'data(label)',
        'width': 40,
        'height': 40,
        'font-size': 10,
        'background-image': ico,
        'background-fit': 'cover',
        'background-color': '#FFF',
      }
    });
  });

  // For each node different color based on inbound links
  nodes.forEach(node => {
    if (node.inbound === 2){
      styles.push({
        selector: `node[id = "${node.id}"]`, // Selector for this exact node
        style: {
          'background-color': '#6366F1'
        }
      });
    } else if (node.inbound === 3){
      styles.push({
        selector: `node[id = "${node.id}"]`, // Selector for this exact node
        style: {
          'background-color': '#ce64d8ff'
        }
      });
    } else if (node.inbound === 4){
      styles.push({
        selector: `node[id = "${node.id}"]`, // Selector for this exact node
        style: {
          'background-color': '#ea33b3ff'
        }
      });
    } else if (node.inbound === 5){
      styles.push({
        selector: `node[id = "${node.id}"]`, // Selector for this exact node
        style: {
          'background-color': '#ce134bff'
        }
      });
    } else if (node.inbound >= 6){
      styles.push({
        selector: `node[id = "${node.id}"]`, // Selector for this exact node
        style: {
          'background-color': 'rgba(255, 0, 0, 1)'
        }
      });
    }
  });

  // Choose Layout
  const layout = hasSavedPositions
    ? { name: 'preset' }         // nutze gespeicherte Positionen
    : { name: 'cose', animate: true }; // sonst Standard-Layout

  // Cytoscape initialisieren
  cy = cytoscape({
    container: container,
    elements: [...cyNodes, ...cyEdges],
    style: styles,
    layout: layout
  });

  // Nach dem Layout die Positionen speichern
  cy.on('layoutstop', () => {
    cy.nodes().forEach(n => {
      const nodeData = nodes.get(n.id());
      if (nodeData.position === null) { // nur wenn noch keine Position gespeichert ist
        nodeData.position = n.position();
      }
    });
  });

  // Drag&Drop speichern
  cy.on('dragfree', 'node', (evt) => {
    const node = evt.target;
    const pos = node.position();
    nodes.get(node.id()).position = pos;  // Position merken
  });

  // Node-Klick: Highlight + Details im Panel
  cy.on('tap', 'node', async (evt) => {
    const nodeId = evt.target.id();

    cy.nodes().removeClass('selected');
    evt.target.addClass('selected');

    try {
      const res = await fetch(`http://localhost:3001/details?url=${encodeURIComponent(nodeId)}`);
      const data = await res.json();

      document.getElementById('urlInput').value = data.url;

      const detailsDiv = document.getElementById('details');
      detailsDiv.innerHTML = `
        <h1>Details:</h1>
        <h3>Title: <br><span>${data.title}</span></h3>
        <h3>Link: <br><span><a href="${data.url}" target="_blank">${data.url}</a></span></h3>
        <h3>Inbound Links: <br><span>${nodes.get(data.url).inbound}</span></h3>
        <h3>Outbound Links: <br><span>${nodes.get(data.url).outbound}</span></h3>
      `;
    } catch (err) {
      alert("Error while loading Details: " + err.message);
    }
  });

  // Klick auf leeren Hintergrund → Auswahl aufheben
  cy.on('tap', (evt) => {
    if (evt.target === cy) {
      const selected = cy.nodes('.selected');
      if (selected.length > 0) {
        selected.removeClass('selected');
      }
    }
  });

  // Download-Function
  function downloadGraph(graph) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graph, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "graph.json");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Upload-Function
  document.getElementById("importGraph").addEventListener("change", function(evt) {
    const file = evt.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      try {
        const importedGraph = JSON.parse(content);
        console.log("Graph geladen:", importedGraph);
        drawGraph(importedGraph); 
      } catch (err) {
        alert("Fehler beim Laden der Datei: " + err.message);
      }
    };
    reader.readAsText(file);
  });
}

