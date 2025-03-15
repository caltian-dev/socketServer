import { Server } from "ws";

let wss = null;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (res.socket.server.wss) {
    console.log("WebSocket server is already running.");
    res.end();
    return;
  }

  console.log("Starting WebSocket server...");

  const server = res.socket.server;
  wss = new Server({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected");
    ws.send("Hello from Vercel WebSocket Server!");

    ws.on("message", (message) => {
      console.log("Received:", message);
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });

  res.socket.server.wss = wss;

  res.end();
}
