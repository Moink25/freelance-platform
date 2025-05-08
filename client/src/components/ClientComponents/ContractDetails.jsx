import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const ContractDetails = ({ orderId }) => {
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(null);
  const { token } = useSelector((state) => state.user);

  useEffect(() => {
    if (orderId) {
      fetchContractDetails();
    }
  }, [orderId]);

  const fetchContractDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3001/api/contracts/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setContract(response.data.contract);
      } else {
        // Contract might not exist yet for this order
        console.log("No contract found for this order");
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching contract details:", error);
      setLoading(false);
    }
  };

  const createContract = async () => {
    try {
      setLoading(true);
      console.log("Attempting to create contract for order:", orderId);
      console.log("Using token:", token);

      const response = await axios.post(
        `http://localhost:3001/api/contracts/create/${orderId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Contract creation response:", response.data);

      if (response.data.success) {
        toast.success("Blockchain contract created successfully");
        setContract(response.data.contract);
      } else {
        console.error("Contract creation failed:", response.data);
        toast.error(response.data.message || "Failed to create contract");
      }
      setLoading(false);
    } catch (error) {
      console.error("Error creating contract:", error);

      // Extract and display more specific error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);

        toast.error(
          `Error creating contract: ${
            error.response.data.message || error.response.status
          }`
        );
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        toast.error("No response from server. Please check your connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
        toast.error(`Error: ${error.message}`);
      }

      setLoading(false);
    }
  };

  const activateContract = async () => {
    try {
      setLoading(true);
      console.log("Attempting to activate contract for order:", orderId);

      const response = await axios.post(
        `http://localhost:3001/api/contracts/activate/${orderId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Contract activation response:", response.data);

      if (response.data.success) {
        toast.success("Contract activated successfully");
        setContract(response.data.contract);
      } else {
        console.error("Contract activation failed:", response.data);
        toast.error(response.data.message || "Failed to activate contract");
      }
      setLoading(false);
    } catch (error) {
      console.error("Error activating contract:", error);

      // Extract and display more specific error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);

        // Check if the error is related to wallet connection
        if (error.response.data.needsWallet) {
          toast.error(
            `Please connect your ${error.response.data.userRole} MetaMask wallet first`
          );
        } else {
          toast.error(
            `Error activating contract: ${
              error.response.data.message || error.response.status
            }`
          );
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        toast.error("No response from server. Please check your connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
        toast.error(`Error: ${error.message}`);
      }

      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "created":
        return "status-badge created";
      case "active":
        return "status-badge active";
      case "completed":
        return "status-badge completed";
      case "cancelled":
        return "status-badge cancelled";
      case "disputed":
        return "status-badge disputed";
      default:
        return "status-badge";
    }
  };

  if (loading) {
    return <div className="contract-loading">Loading contract details...</div>;
  }

  if (!contract) {
    return (
      <div className="no-contract">
        <h3>Blockchain Contract</h3>
        <p>No blockchain contract has been created for this order yet.</p>
        <button className="create-contract-btn" onClick={createContract}>
          Create Blockchain Contract
        </button>
      </div>
    );
  }

  return (
    <div className="contract-details">
      <h3>Blockchain Contract</h3>
      <div className="contract-card">
        <div className="contract-header">
          <div className="contract-status">
            <span className={getStatusBadgeClass(contract.status)}>
              {contract.status.charAt(0).toUpperCase() +
                contract.status.slice(1)}
            </span>
          </div>
          <div className="contract-id">
            <small>Contract ID: {contract._id}</small>
          </div>
        </div>

        <div className="contract-body">
          <div className="contract-section">
            <h4>Blockchain Details</h4>
            <div className="contract-field">
              <span className="field-label">Contract Address:</span>
              <span className="field-value blockchain-address">
                {contract.contractAddress}
              </span>
            </div>
            <div className="contract-field">
              <span className="field-label">Transaction Hash:</span>
              <span className="field-value transaction-hash">
                {contract.transactionHash}
              </span>
            </div>
          </div>

          <div className="contract-section">
            <h4>Contract Terms</h4>
            <div className="contract-terms">
              <pre>{contract.terms}</pre>
            </div>
          </div>

          <div className="contract-section">
            <h4>Timeline</h4>
            <div className="contract-field">
              <span className="field-label">Created:</span>
              <span className="field-value">
                {formatDate(contract.createdAt)}
              </span>
            </div>
            <div className="contract-field">
              <span className="field-label">Expected Delivery:</span>
              <span className="field-value">
                {formatDate(contract.deliveryDate)}
              </span>
            </div>
            {contract.completedDate && (
              <div className="contract-field">
                <span className="field-label">Completed:</span>
                <span className="field-value">
                  {formatDate(contract.completedDate)}
                </span>
              </div>
            )}
            {contract.cancelledDate && (
              <div className="contract-field">
                <span className="field-label">Cancelled:</span>
                <span className="field-value">
                  {formatDate(contract.cancelledDate)}
                </span>
              </div>
            )}
          </div>
        </div>

        {contract.status === "created" && (
          <div className="contract-actions">
            <button
              className="activate-contract-btn"
              onClick={activateContract}
            >
              Activate Contract
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractDetails;
