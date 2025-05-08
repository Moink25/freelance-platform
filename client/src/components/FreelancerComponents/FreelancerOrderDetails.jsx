import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { useSelector, useDispatch } from "react-redux";
import { tokenExists } from "../../Redux/UserSlice";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../Loading";
import FreelancerMenu from "./FreelancerMenu";
import FreelancerContractDetails from "./FreelancerContractDetails";

export default function FreelancerOrderDetails() {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const { id, orderId } = useParams();
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

    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      console.log(
        "Fetching order details for order ID:",
        orderId,
        "with token:",
        token
      );

      const response = await axios.get(
        `http://localhost:3001/api/freelancer/order/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Order details response:", response.data);

      if (response.data.status === 200) {
        setOrder(response.data.orderDetails);
      } else {
        console.error("Failed to fetch order details:", response.data);
        toast.error(response.data.msg || "Failed to fetch order details");
        if (response.data.status === 404) {
          navigate("/404");
        } else if (response.data.status === 403) {
          navigate("/login");
        }
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Error fetching order details");
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

  return (
    <>
      {loading && <Loading />}
      <div className="ServiceOrderDetails">
        <div className="container">
          <div className="section">
            <div className="header">Order Details</div>
            {order ? (
              <div className="order-content">
                <div className="order-section service-info">
                  <h3>Service Information</h3>
                  <div className="order-field">
                    <span className="field-label">Title:</span>
                    <span className="field-value">
                      {order.serviceInfo.title}
                    </span>
                  </div>
                  <div className="order-field">
                    <span className="field-label">Price:</span>
                    <span className="field-value">
                      {order.serviceInfo.price} ₹
                    </span>
                  </div>
                  <div className="order-field">
                    <span className="field-label">Created On:</span>
                    <span className="field-value">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="order-section client-info">
                  <h3>Client Information</h3>
                  <div className="order-field">
                    <span className="field-label">Client:</span>
                    <span className="field-value">
                      {order.clientInfo.username}
                    </span>
                  </div>
                </div>

                <div className="order-section status-info">
                  <h3>Order Status</h3>
                  <div className="order-field">
                    <span className="field-label">Status:</span>
                    <span
                      className={`field-value status-${order.status.toLowerCase()}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="order-field">
                    <span className="field-label">Payment:</span>
                    <span
                      className={`field-value ${
                        order.paymentStatus === "completed"
                          ? "status-completed"
                          : "status-pending"
                      }`}
                    >
                      {order.paymentStatus === "completed" ? "Paid" : "Pending"}
                    </span>
                  </div>
                </div>

                {/* Blockchain Contract Details */}
                <div className="contract-details-container">
                  <h3>Blockchain Contract</h3>
                  <FreelancerContractDetails orderId={orderId} />
                </div>

                {/* Back Button */}
                <div className="back-button-container">
                  <HashLink
                    className="go-back-button"
                    to={`/dashboard/freelancer/${id}/orders`}
                  >
                    <button>Back to Orders</button>
                  </HashLink>
                </div>
              </div>
            ) : (
              !loading && (
                <div className="not-found">Order details not found</div>
              )
            )}
          </div>
          <FreelancerMenu active="orders" />
        </div>
      </div>
    </>
  );
}
