const WebSocket = require("ws");
const net = require("net");

// Timeout settings
const CONNECTION_TIMEOUT_MS = 5000; // 5 seconds timeout for TCP connection

// Create WebSocket server to accept connections from the browser
const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("Browser connected to WebSocket server");

  let printerSocket;

  ws.on("message", (message) => {
    const { printerIP, data } = JSON.parse(message);

    console.log(`Attempting to connect to printer at IP: ${printerIP}`);

    // Create the printer socket
    printerSocket = new net.Socket();

    // Set a timeout to fail quickly if the connection takes too long
    printerSocket.setTimeout(CONNECTION_TIMEOUT_MS);

    // Try to connect to the printer at the specified IP and port 9100
    printerSocket.connect(9100, printerIP, () => {
      console.log(`Connected to printer at ${printerIP}`);

      // Send print data to the printer
      printerSocket.write(data, (err) => {
        if (err) {
          console.error("Error sending data to printer:", err);
          ws.send("Error sending print data");
        } else {
          console.log("Print data sent successfully");
          ws.send("Print data sent successfully");
        }
      });
    });

    // Handle connection timeout
    printerSocket.on("timeout", () => {
      console.error("Connection timed out");
      ws.send("Connection to printer timed out");
      printerSocket.destroy(); // Close the socket
    });

    // Handle connection errors
    printerSocket.on("error", (err) => {
      console.error("Printer connection error:", err);
      ws.send("Error connecting to printer");
      printerSocket.destroy(); // Close the socket in case of error
    });

    // Handle connection closure
    printerSocket.on("close", () => {
      console.log("Printer connection closed");
      ws.send("Printer connection closed");
    });
  });

  ws.on("close", () => {
    if (printerSocket) {
      printerSocket.end();
      console.log("Closed connection to printer");
    }
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
