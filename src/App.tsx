import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { RegisterForm } from "./components/RegisterForm";
import { WebSocketEvents } from "./types/socket.types";
import "./App.css";

const SOCKET_URL = "ws://fp-socket.exagonplus.com";
const API_URL = "https://api.exagonplus.com/v2/rt_job_print";

interface PrintJob {
  url: string;
  body: string;
}

interface ApiResponse {
  status: number;
  message: string;
  data: PrintJob[];
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function App(): JSX.Element {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");

  const handlePrinterRaise = async () => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-App-Id": "exagon",
          "X-Organization-Id": "exagon",
        },
      });

      const result: ApiResponse = await response.json();

      if (result.status === 200) {
        // Esegui le richieste una alla volta con delay
        for (const job of result.data) {
          const formattedBody = job.body.replace(/\\"/g, '"');

          console.log("Executing print job:", {
            url: job.url,
            body: formattedBody,
          });

          await fetch(job.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/xml",
            },
            body: formattedBody,
          });

          // Attendi 15 secondi prima del prossimo job
          if (result.data.indexOf(job) < result.data.length - 1) {
            console.log("Waiting 15 seconds before next job...");
            await delay(15000);
          }
        }

        console.log("All print jobs completed");
      }
    } catch (error) {
      console.error("Error handling printer raise:", error);
    }
  };

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
    });

    socketInstance.on("connect", () => {
      console.log("Connected to WebSocket server");
      setConnectionStatus("connected");
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setConnectionStatus("disconnected");
      setIsRegistered(false);
    });

    socketInstance.on(WebSocketEvents.RAISE_PRINTER, (data) => {
      console.log("Received raise-printer event:", data);
      handlePrinterRaise();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleRegistered = () => {
    setIsRegistered(true);
  };

  if (!socket || connectionStatus === "connecting") {
    return <div>Connecting to server...</div>;
  }

  if (connectionStatus === "disconnected") {
    return <div>Disconnected from server. Trying to reconnect...</div>;
  }

  return (
    <div className="App">
      {!isRegistered ? (
        <RegisterForm socket={socket} onRegistered={handleRegistered} />
      ) : (
        <div className="printer-status">
          <h2>Fiscal Printer Connected</h2>
          <p>Waiting for printer events...</p>
        </div>
      )}
    </div>
  );
}

export default App;
