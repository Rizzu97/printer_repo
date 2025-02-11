import React, { useState } from "react";
import { Socket } from "socket.io-client";
import type { FormSubmitEvent } from "../types/react.types";
import { WebSocketEvents } from "../types/socket.types";

interface RegisterFormProps {
  socket: Socket;
  onRegistered: () => void;
}

export const RegisterForm = ({ socket, onRegistered }: RegisterFormProps) => {
  const [circuitId, setCircuitId] = useState("");
  const [posIdsInput, setPosIdsInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [testIp, setTestIp] = useState("192.168.0.99");
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = async () => {
    try {
      setTestResult("Testing...");
      const testXml = `<?xml version="1.0" encoding="UTF-8"?><Service><cmd>=K</cmd><cmd>=C1</cmd><cmd>=R1/$3600/(TEST STAMPANTE)</cmd><cmd>=T1/$3600</cmd><cmd>=c</cmd></Service>`;

      const response = await fetch(`http://${testIp}/service.cgi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
        },
        body: testXml,
      });

      if (response.ok) {
        setTestResult("Test successful! Printer responded.");
      } else {
        setTestResult(`Test failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestResult(
        `Test failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const handleSubmit = (e: FormSubmitEvent) => {
    e.preventDefault();
    setError(null);
    setIsRegistering(true);

    if (!circuitId || !posIdsInput) {
      setError("Please fill in all fields");
      setIsRegistering(false);
      return;
    }

    const posIds = posIdsInput
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);

    socket.emit(WebSocketEvents.REGISTER, { circuitId, posIds });
    // Dopo l'invio della registrazione, consideriamo l'operazione completata
    setIsRegistering(false);
    onRegistered();
  };

  return (
    <div className="register-form">
      <h2>Register Fiscal Printer</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="circuitId">Circuit Number:</label>
          <input
            id="circuitId"
            type="text"
            value={circuitId}
            onChange={(e) => setCircuitId(e.target.value)}
            placeholder="Enter Circuit ID"
            disabled={isRegistering}
          />
        </div>

        <div className="form-group">
          <label htmlFor="posIds">POS IDs (comma-separated):</label>
          <input
            id="posIds"
            type="text"
            value={posIdsInput}
            onChange={(e) => setPosIdsInput(e.target.value)}
            placeholder="Enter POS IDs (e.g. 1234,5678)"
            disabled={isRegistering}
          />
          <small>Multiple POS IDs can be separated by commas</small>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={isRegistering}>
          {isRegistering ? "Registering..." : "Register"}
        </button>

        <div className="test-section">
          <h3>Printer Test</h3>
          <div className="form-group">
            <label htmlFor="testIp">Printer IP:</label>
            <input
              id="testIp"
              type="text"
              value={testIp}
              onChange={(e) => setTestIp(e.target.value)}
              placeholder="Enter printer IP"
            />
          </div>
          <button type="button" onClick={handleTest} className="test-button">
            Test Printer
          </button>
          {testResult && (
            <div
              className={`test-result ${
                testResult.includes("failed") ? "error" : "success"
              }`}
            >
              {testResult}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
