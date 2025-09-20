// Event-Listener für Crawl-Button
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

    // Graph zeichnen
    drawGraph(data.links, data.url);

  } catch (err) {
    alert("Error while reading links: " + err.message);
  }
});

// SEHR WICHTIG!!!! FÜR ALGORITHMUS
// Function: Draw Graph with Cytoscape.js
function drawGraph(links, baseUrl) {
  const nodes = [{ data: { id: baseUrl, label: baseUrl } }];
  const edges = [];
  links.forEach(link => {
    nodes.push({ data: { id: link} });
    edges.push({ data: { source: baseUrl, target: link } });
  });

  // Alten Graphen löschen
  const container = document.getElementById('graph');
  container.innerHTML = '';
  document.getElementById('details').innerHTML = '<h1>Details:</h1>'; // Details-Panel leeren

  let ico = "http://localhost:3001/favicon?url=" + new URL(baseUrl).origin;

  // Cytoscape-Setup
  const cy = cytoscape({
    container: container,
    elements: { nodes, edges },
    style: [
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
        selector: `node[id = "${baseUrl}"]`,  // Base Node
        style: {
          'label': 'data(label)',
          'width': 40,
          'height': 40,
          'font-size': 10,
          'background-image': ico,
          'background-fit': 'cover',
          'background-color': '#FFF',
        }
      },
      {
        selector: 'node.selected',
        style: {
          'background-color': 'red'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          'target-arrow-shape': 'triangle',
          'overlay-opacity': 0,
          'border-width': 0,
          'curve-style': 'bezier'
        }
      }
    ],
    layout: { name: 'cose', animate: true },
    selectionType: 'single',
    boxSelectionEnabled: false,
    userPanningEnabled: true,
    userZoomingEnabled: true,
    tapHighlight: false,
    autoungrabify: false   // Nodes bleiben verschiebbar
  });

  // Node-Klick: Highlight + Details im Panel
  cy.on('tap', 'node', async (evt) => {
    const nodeId = evt.target.id();

    // Highlight nur auf diese Node
    cy.nodes().removeClass('selected');
    evt.target.addClass('selected');

    // Details abrufen
    try {
      const res = await fetch(`http://localhost:3001/details?url=${encodeURIComponent(nodeId)}`);
      const data = await res.json();

      document.getElementById('urlInput').value = data.url;

      const detailsDiv = document.getElementById('details');
      detailsDiv.innerHTML = `
        <h1>Details:</h1>
        <h3>Title: <br><span>${data.title}</span></h3>
        <h3>Link: <br><span><a href="${data.url}" target="_blank">${data.url}</a></span></h3>
      `;
    } catch (err) {
      alert("Error while loading Details: " + err.message);
    }
  });

  // Klick auf leeren Hintergrund
  cy.on('tap', (evt) => {
    if (evt.target === cy) {
      const selected = cy.nodes('.selected');
      if (selected.length > 0) {
        selected.removeClass('selected');
      }
    }
  });


  // Download-Fuction
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
      // jetzt kannst du importedGraph ins Cytoscape laden oder an Backend schicken
      console.log("Graph geladen:", importedGraph);
      drawGraph(importedGraph); 
    } catch (err) {
      alert("Fehler beim Laden der Datei: " + err.message);
    }
  };
  reader.readAsText(file);
  });
}
