import { Server } from "ws";

let wss = null;

export default function handler(req, res) {
  if (!wss) {
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
  }

  res.end();
}
