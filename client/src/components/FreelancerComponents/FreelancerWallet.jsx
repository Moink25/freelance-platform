import React, { useState, useEffect } from "react";
import FreelancerMenu from "./FreelancerMenu";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { tokenExists } from "../../Redux/UserSlice";
import { toast } from "react-toastify";
import Loading from "../Loading";
import axios from "axios";

export default function FreelancerWallet() {
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [razorpayAccount, setRazorpayAccount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const { id } = useParams();
  const { token } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    tokenExists(token, navigate, dispatch).then(
      (data) =>
        (data == false ||
          JSON.parse(localStorage.getItem("userInfo")).role !== "freelancer" ||
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
      setRazorpayAccount(res.data.razorpayAccount || "");

      const transRes = await axios.get(
        "http://localhost:3001/api/wallet/transactions",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTransactions(transRes.data.transactions);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast.error(error.response?.data?.msg || "Error fetching wallet data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!razorpayAccount) {
      toast.error("Please enter a valid Razorpay account ID");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:3001/api/wallet/updateAccount",
        {
          razorpayAccount,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Account update response:", res.data);
      toast.success("Account details updated successfully!");
      setRazorpayAccount(res.data.razorpayAccount);
    } catch (error) {
      console.error("Error updating account:", error);
      toast.error(
        error.response?.data?.msg || "Error updating account details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawMoney = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > walletBalance) {
      toast.error("Withdrawal amount cannot exceed wallet balance");
      return;
    }

    if (!razorpayAccount) {
      toast.error("Please update your Razorpay account ID first");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:3001/api/wallet/withdraw",
        {
          amount: parseFloat(amount),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Withdrawal response:", res.data);
      toast.success("Withdrawal request submitted successfully!");
      setAmount("");
      fetchWalletData();
    } catch (error) {
      console.error("Error withdrawing:", error);
      toast.error(error.response?.data?.msg || "Error processing withdrawal");
    } finally {
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
      <div className="FreelancerWallet">
        <div className="container">
          <div className="section">
            <div className="wallet-header">My Wallet</div>

            <div className="wallet-balance">
              <div className="balance-title">Current Balance</div>
              <div className="balance-amount">{walletBalance} ₹</div>
            </div>

            <div className="wallet-actions">
              <div className="account-form">
                <h3>Razorpay Account Details</h3>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Enter Razorpay Account ID"
                    value={razorpayAccount}
                    onChange={(e) => setRazorpayAccount(e.target.value)}
                  />
                  <button onClick={handleUpdateAccount}>Update Account</button>
                </div>
              </div>

              <div className="withdraw-form">
                <h3>Withdraw Money</h3>
                <div className="form-group">
                  <input
                    type="number"
                    placeholder="Enter Amount (₹)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    max={walletBalance}
                  />
                  <button
                    onClick={handleWithdrawMoney}
                    disabled={!razorpayAccount}
                  >
                    Withdraw
                  </button>
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
                        {transaction.type === "earnings"
                          ? "+"
                          : transaction.type === "withdrawal"
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
          <FreelancerMenu active="wallet" />
        </div>
      </div>
    </>
  );
}
