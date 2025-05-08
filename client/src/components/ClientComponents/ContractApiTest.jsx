import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

const ContractApiTest = () => {
  const [apiStatus, setApiStatus] = useState("Unknown");
  const [statusTimestamp, setStatusTimestamp] = useState(null);
  const [orderId, setOrderId] = useState("");
  const [createResult, setCreateResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const { token, user } = useSelector((state) => state.user);

  useEffect(() => {
    checkApiStatus();
    fetchUserOrders();
  }, []);

  const checkApiStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:3001/api/contracts/status"
      );
      console.log("API Status response:", response.data);
      setApiStatus(response.data.success ? "Running" : "Error");
      setStatusTimestamp(response.data.timestamp);
    } catch (error) {
      console.error("Error checking API status:", error);
      setApiStatus("Error - " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    if (!token || !user) return;

    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/client/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("User orders response:", response.data);
      if (response.data.status === 200) {
        setOrders(response.data.ClientOrders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const testCreateContract = async () => {
    if (!orderId) {
      alert("Please enter an Order ID");
      return;
    }

    try {
      setLoading(true);
      console.log(`Testing contract creation for order: ${orderId}`);
      console.log(`Using token: ${token}`);

      const response = await axios.post(
        `http://localhost:3001/api/contracts/create/${orderId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Create contract response:", response.data);
      setCreateResult(response.data);
    } catch (error) {
      console.error("Error creating contract:", error);

      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        setCreateResult({
          success: false,
          error: `Server error: ${error.response.status}`,
          message: error.response.data.message || "Unknown error",
          data: error.response.data,
        });
      } else if (error.request) {
        console.error("No response received:", error.request);
        setCreateResult({
          success: false,
          error: "No response from server",
          message: "The request was made but no response was received",
        });
      } else {
        console.error("Error message:", error.message);
        setCreateResult({
          success: false,
          error: "Request setup error",
          message: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Test the specific order ID that's causing issues
  const testSpecificOrder = () => {
    setOrderId("68167c3771822800537bc2a9");
    setTimeout(() => {
      testCreateContract();
    }, 500);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Contract API Test Tool</h2>

      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "5px",
        }}
      >
        <h3>API Status</h3>
        <p>
          Status: <strong>{apiStatus}</strong>
        </p>
        {statusTimestamp && (
          <p>Last checked: {new Date(statusTimestamp).toLocaleString()}</p>
        )}
        <button
          onClick={checkApiStatus}
          disabled={loading}
          style={{
            padding: "8px 16px",
            background: "#feab5e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {loading ? "Checking..." : "Check API Status"}
        </button>
      </div>

      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "5px",
          backgroundColor: "#f8f9fa",
        }}
      >
        <h3>Test Specific Order ID</h3>
        <p>
          <strong>Order ID:</strong> 68167c3771822800537bc2a9
        </p>
        <button
          onClick={testSpecificOrder}
          disabled={loading}
          style={{
            padding: "8px 16px",
            background: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Test Problematic Order ID
        </button>
      </div>

      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "5px",
        }}
      >
        <h3>Your Orders</h3>
        {orders.length === 0 ? (
          <p>No orders found. Please create an order first.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "10px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                  }}
                >
                  Order ID
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                  }}
                >
                  Service
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                  }}
                >
                  Amount
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order._id}
                  style={{
                    backgroundColor:
                      order._id === "68167c3771822800537bc2a9"
                        ? "#fff3cd"
                        : "transparent",
                  }}
                >
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {order._id}
                    {order._id === "68167c3771822800537bc2a9" && (
                      <span style={{ color: "#dc3545", marginLeft: "5px" }}>
                        (Problem order)
                      </span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {order.serviceName}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    ${order.amount}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {order.status}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <button
                      onClick={() => setOrderId(order._id)}
                      style={{
                        padding: "4px 8px",
                        background: "#feab5e",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Use This ID
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button
          onClick={fetchUserOrders}
          disabled={loading}
          style={{
            padding: "8px 16px",
            background: "#feab5e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          Refresh Orders
        </button>
      </div>

      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "5px",
        }}
      >
        <h3>Test Contract Creation</h3>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Order ID:
          </label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter Order ID to test"
            style={{
              padding: "8px",
              width: "100%",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
        </div>
        <button
          onClick={testCreateContract}
          disabled={loading || !orderId}
          style={{
            padding: "8px 16px",
            background: "#feab5e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {loading ? "Testing..." : "Test Create Contract"}
        </button>
      </div>

      {createResult && (
        <div
          style={{
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            backgroundColor: createResult.success ? "#f0fff0" : "#fff0f0",
          }}
        >
          <h3>Result: {createResult.success ? "Success" : "Error"}</h3>
          <p>
            <strong>Message:</strong> {createResult.message}
          </p>

          {createResult.needsWallet && (
            <div
              style={{
                backgroundColor: "#fff3cd",
                padding: "10px",
                borderRadius: "5px",
                marginTop: "10px",
              }}
            >
              <p>
                <strong>Wallet Required:</strong> {createResult.userRole} needs
                to connect their MetaMask wallet
              </p>
              <p>
                Go to the Profile page and connect your MetaMask wallet before
                creating a contract.
              </p>
            </div>
          )}

          {createResult.contract && (
            <div>
              <p>
                <strong>Contract ID:</strong> {createResult.contract._id}
              </p>
              <p>
                <strong>Status:</strong> {createResult.contract.status}
              </p>
              <p>
                <strong>Amount:</strong> {createResult.contract.amount}
              </p>
            </div>
          )}
          <details>
            <summary>View Raw Response</summary>
            <pre
              style={{
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "4px",
                overflow: "auto",
              }}
            >
              {JSON.stringify(createResult, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default ContractApiTest;
