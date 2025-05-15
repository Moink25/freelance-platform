import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { tokenExists } from "../../Redux/UserSlice";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../Loading";
import FreelancerMenu from "./FreelancerMenu";
import { MdOutlineFilterAltOff } from "react-icons/md";

export default function FreelancerContracts() {
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [filter, setFilter] = useState("all");
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.user);

  useEffect(() => {
    // Verify user is logged in and is a freelancer
    tokenExists(token, navigate, dispatch).then(
      (data) =>
        (data == false ||
          JSON.parse(localStorage.getItem("userInfo")).role !== "freelancer" ||
          JSON.parse(localStorage.getItem("userInfo"))._id !== id) &&
        navigate("/login")
    );

    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      console.log("Fetching contracts for freelancer");
      const response = await axios.get(`http://localhost:3001/api/contracts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Contracts response:", response.data);

      if (response.data.success) {
        setContracts(response.data.contracts);
      } else {
        toast.error("Failed to fetch contracts");
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Error fetching contracts");
    } finally {
      setLoading(false);
    }
  };

  const activateContract = async (contractId) => {
    setLoading(true);
    try {
      console.log("Activating contract:", contractId);
      const response = await axios.post(
        `http://localhost:3001/api/contracts/activate/${contractId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Contract activation response:", response.data);

      if (response.data.success || response.data.status === 200) {
        toast.success("Contract activated successfully");
        fetchContracts(); // Refresh contracts
      } else {
        toast.error(
          response.data.message ||
            response.data.msg ||
            "Failed to activate contract"
        );
      }
    } catch (error) {
      console.error("Error activating contract:", error);
      toast.error(error.response?.data?.message || "Error activating contract");
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
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "created":
        return "status-pending";
      case "active":
        return "status-active";
      case "completed":
        return "status-completed";
      case "cancelled":
        return "status-cancelled";
      default:
        return "";
    }
  };

  const filteredContracts = () => {
    if (filter === "all") {
      return contracts;
    }
    return contracts.filter((contract) => contract.status === filter);
  };

  return (
    <>
      {loading && <Loading />}
      <div className="FreelancerContracts">
        <div className="container">
          <div className="section">
            <div className="contracts-header">My Contracts</div>
            <div className="filterContracts">
              <div
                className={
                  filter === "all" ? "filter all active" : "filter all"
                }
                onClick={() => setFilter("all")}
              >
                <MdOutlineFilterAltOff /> All
              </div>
              <div
                className={
                  filter === "created"
                    ? "filter pending active"
                    : "filter pending"
                }
                onClick={() => setFilter("created")}
              >
                Pending Activation
              </div>
              <div
                className={
                  filter === "active" ? "filter active active" : "filter active"
                }
                onClick={() => setFilter("active")}
              >
                Active
              </div>
              <div
                className={
                  filter === "completed"
                    ? "filter completed active"
                    : "filter completed"
                }
                onClick={() => setFilter("completed")}
              >
                Completed
              </div>
              <div
                className={
                  filter === "cancelled"
                    ? "filter cancelled active"
                    : "filter cancelled"
                }
                onClick={() => setFilter("cancelled")}
              >
                Cancelled
              </div>
            </div>

            <div className="contracts-list">
              {filteredContracts().length > 0 ? (
                filteredContracts().map((contract) => (
                  <div className="contract-card" key={contract._id}>
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
                        <h4>Order Information</h4>
                        <div className="contract-field">
                          <span className="field-label">Order ID:</span>
                          <span className="field-value">
                            {contract.orderId}
                          </span>
                        </div>
                        <div className="contract-field">
                          <span className="field-label">Created:</span>
                          <span className="field-value">
                            {formatDate(contract.createdAt)}
                          </span>
                        </div>
                        <div className="contract-field">
                          <span className="field-label">
                            Expected Delivery:
                          </span>
                          <span className="field-value">
                            {formatDate(contract.deliveryDate)}
                          </span>
                        </div>
                        <div className="contract-field">
                          <span className="field-label">Amount:</span>
                          <span className="field-value">
                            {contract.amount} ₹
                          </span>
                        </div>
                      </div>
                      <div className="contract-section">
                        <h4>Contract Terms</h4>
                        <div className="contract-terms">
                          <pre>{contract.terms}</pre>
                        </div>
                      </div>
                    </div>
                    <div className="contract-actions">
                      <button
                        className="view-details-btn"
                        onClick={() =>
                          navigate(
                            `/dashboard/freelancer/${id}/services/order/${contract.orderId}`
                          )
                        }
                      >
                        View Full Details
                      </button>

                      {contract.status === "created" && (
                        <button
                          className="activate-contract-btn"
                          onClick={() => activateContract(contract._id)}
                        >
                          Accept & Activate
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-contracts">
                  {loading ? "Loading contracts..." : "No contracts found"}
                </div>
              )}
            </div>
          </div>
          <FreelancerMenu active="contracts" />
        </div>
      </div>
    </>
  );
}
