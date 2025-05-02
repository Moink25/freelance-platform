import React, { useState, useEffect } from "react";
import ClientMenu from "./ClientMenu";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { tokenExists } from "../../Redux/UserSlice";
import { toast } from "react-toastify";
import Loading from "../Loading";
import axios from "axios";

export default function ClientWallet() {
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const { id } = useParams();
  const { token } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    tokenExists(token, navigate, dispatch).then(
      (data) =>
        (data == false ||
          JSON.parse(localStorage.getItem("userInfo")).role !== "client" ||
          JSON.parse(localStorage.getItem("userInfo"))._id !== id) &&
        navigate("/login")
    );
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/api/wallet/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWalletBalance(res.data.balance);
      // Store the Razorpay key for later use
      if (res.data.razorpayKeyId) {
        localStorage.setItem("razorpayKeyId", res.data.razorpayKeyId);
      }

      const transRes = await axios.get(
        "http://localhost:3001/api/wallet/transactions",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTransactions(transRes.data.transactions);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Error fetching wallet data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:3001/api/wallet/createOrder",
        {
          amount: parseFloat(amount) * 100, // Razorpay expects amount in paise
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Order created:", res.data); // Debug log

      if (!window.Razorpay) {
        setLoading(false);
        toast.error("Razorpay SDK failed to load. Please try again later.");
        return;
      }

      // Get the stored Razorpay key or fall back to default
      const razorpayKeyId =
        localStorage.getItem("razorpayKeyId") || "rzp_test_yourKeyHere";

      const options = {
        key: razorpayKeyId,
        amount: res.data.amount,
        currency: "INR",
        name: "Work Wonders",
        description: "Add money to wallet",
        order_id: res.data.id,
        handler: async function (response) {
          console.log("Payment success response:", response); // Debug log
          try {
            const verifyRes = await axios.post(
              "http://localhost:3001/api/wallet/verifyPayment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            console.log("Verification response:", verifyRes.data); // Debug log
            toast.success("Payment successful!");
            setAmount("");
            fetchWalletData();
          } catch (error) {
            console.error("Verification error:", error); // Debug log
            toast.error(
              error.response?.data?.msg || "Payment verification failed"
            );
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem("userInfo")).fullName,
          email: JSON.parse(localStorage.getItem("userInfo")).email,
        },
        theme: {
          color: "#F37254",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            console.log("Checkout form closed"); // Debug log
          },
        },
      };

      try {
        const paymentObject = new window.Razorpay(options);
        paymentObject.on("payment.failed", function (response) {
          console.error("Payment failed:", response.error); // Debug log
          toast.error(`Payment failed: ${response.error.description}`);
          setLoading(false);
        });
        paymentObject.open();
      } catch (razorpayError) {
        console.error("Razorpay error:", razorpayError); // Debug log
        toast.error("Error opening payment form. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Create order error:", error); // Debug log
      toast.error(error.response?.data?.msg || "Error creating payment");
      setLoading(false);
    }
  };

  // Formatting date for transaction history
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("en-IN") + " " + date.toLocaleTimeString("en-IN")
    );
  };

  return (
    <>
      {loading && <Loading />}
      <div className="ClientWallet">
        <div className="container">
          <div className="section">
            <div className="wallet-header">My Wallet</div>

            <div className="wallet-balance">
              <div className="balance-title">Current Balance</div>
              <div className="balance-amount">{walletBalance} ₹</div>
            </div>

            <div className="wallet-actions">
              <div className="add-money-form">
                <h3>Add Money to Wallet</h3>
                <div className="form-group">
                  <input
                    type="number"
                    placeholder="Enter Amount (₹)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                  />
                  <button onClick={handleAddMoney}>Add Money</button>
                </div>
              </div>
            </div>

            <div className="wallet-transactions">
              <h3>Transaction History</h3>
              {transactions.length > 0 ? (
                <div className="transaction-list">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className={`transaction-item ${transaction.type}`}
                    >
                      <div className="transaction-info">
                        <div className="transaction-type">
                          {transaction.type.charAt(0).toUpperCase() +
                            transaction.type.slice(1)}
                        </div>
                        <div className="transaction-date">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </div>
                      <div className="transaction-amount">
                        {transaction.type === "deposit"
                          ? "+"
                          : transaction.type === "payment"
                          ? "-"
                          : ""}
                        {transaction.amount} ₹
                      </div>
                      <div className="transaction-status">
                        {transaction.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-transactions">No transactions yet</div>
              )}
            </div>
          </div>
          <ClientMenu active="wallet" />
        </div>
      </div>
    </>
  );
}
