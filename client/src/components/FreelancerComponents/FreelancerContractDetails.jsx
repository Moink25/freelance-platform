import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const FreelancerContractDetails = ({ orderId }) => {
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState(null);
  const { token } = useSelector((state) => state.user);

  useEffect(() => {
    if (orderId) {
      fetchContractDetails();
    }
  }, [orderId]);

  const fetchContractDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching contract details for order:", orderId);
      const response = await axios.get(
        `http://localhost:3001/api/contracts/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Contract details response:", response.data);

      if (response.data.success) {
        setContract(response.data.contract);
      } else {
        // Contract might not exist yet for this order
        console.log("No contract found for this order:", response.data.message);
        setError(response.data.message || "No contract found for this order");
      }
    } catch (error) {
      console.error("Error fetching contract details:", error);
      setError("Failed to load contract details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const activateContract = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!contract || !contract._id) {
        setError("Contract not found. Please refresh or try again later.");
        setLoading(false);
        return;
      }

      console.log("Activating contract ID:", contract._id);
      const response = await axios.post(
        `http://localhost:3001/api/contracts/activate/${contract._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Contract activation response:", response.data);

      if (response.data.success || response.data.status === 200) {
        toast.success("Contract activated successfully");
        fetchContractDetails(); // Refresh contract details
      } else {
        toast.error(
          response.data.message ||
            response.data.msg ||
            "Failed to activate contract"
        );
        setError(
          response.data.message ||
            response.data.msg ||
            "Failed to activate contract"
        );
      }
    } catch (error) {
      console.error("Error activating contract:", error);
      toast.error(error.response?.data?.message || "Error activating contract");
      setError("Failed to activate contract. Please try again.");
    } finally {
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

  const createContract = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Creating contract for order:", orderId);
      const response = await axios.post(
        `http://localhost:3001/api/contracts/create`,
        { orderId: orderId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Contract creation response:", response.data);

      if (response.data.success || response.data.status === 200) {
        toast.success("Contract created successfully");
        fetchContractDetails(); // Refresh contract details
      } else {
        toast.error(
          response.data.message ||
            response.data.msg ||
            "Failed to create contract"
        );
        setError(
          response.data.message ||
            response.data.msg ||
            "Failed to create contract"
        );
      }
    } catch (error) {
      console.error("Error creating contract:", error);
      toast.error(error.response?.data?.message || "Error creating contract");
      setError("Failed to create contract. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="contract-loading">Loading contract details...</div>;
  }

  if (!contract) {
    return (
      <div className="no-contract">
        <h3>Blockchain Contract</h3>
        <p>
          {error ||
            "No blockchain contract has been created for this order yet."}
        </p>
        <button
          className="create-contract-btn"
          onClick={createContract}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Contract"}
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
            <span className={`status-${contract.status}`}>
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
            {contract.activatedDate && (
              <div className="contract-field">
                <span className="field-label">Activated:</span>
                <span className="field-value">
                  {formatDate(contract.activatedDate)}
                </span>
              </div>
            )}
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

        {/* Only freelancers can activate contracts */}
        {contract.status === "created" && (
          <div className="contract-actions">
            <button
              className="activate-contract-btn"
              onClick={activateContract}
            >
              Accept & Activate Contract
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FreelancerContractDetails;
