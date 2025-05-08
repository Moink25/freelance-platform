import React, { useState, useEffect } from "react";
import FreelancerMenu from "./FreelancerMenu";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { tokenExists } from "../../Redux/UserSlice";
import { toast } from "react-toastify";
import Loading from "../Loading";
import axios from "axios";
import {
  FaMoneyBillWave,
  FaUniversity,
  FaQrcode,
  FaCreditCard,
} from "react-icons/fa";

export default function FreelancerWallet() {
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalMethod, setWithdrawalMethod] = useState("");
  const [withdrawalDetails, setWithdrawalDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    accountName: "",
    upiId: "",
    cardNumber: "",
    cardHolderName: "",
    expiryMonth: "",
    expiryYear: "",
  });

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

  const handleWithdrawMoney = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > walletBalance) {
      toast.error("Withdrawal amount cannot exceed wallet balance");
      return;
    }

    // Show withdrawal method selection modal
    setShowWithdrawalModal(true);
  };

  const handleDetailChange = (e) => {
    setWithdrawalDetails({
      ...withdrawalDetails,
      [e.target.name]: e.target.value,
    });
  };

  const validateWithdrawalDetails = () => {
    if (withdrawalMethod === "bank") {
      if (
        !withdrawalDetails.accountNumber ||
        !withdrawalDetails.ifscCode ||
        !withdrawalDetails.accountName
      ) {
        toast.error("Please fill in all bank account details");
        return false;
      }
    } else if (withdrawalMethod === "upi") {
      if (!withdrawalDetails.upiId) {
        toast.error("Please enter a valid UPI ID");
        return false;
      }
    } else if (withdrawalMethod === "card") {
      if (
        !withdrawalDetails.cardNumber ||
        !withdrawalDetails.cardHolderName ||
        !withdrawalDetails.expiryMonth ||
        !withdrawalDetails.expiryYear
      ) {
        toast.error("Please fill in all card details");
        return false;
      }
    } else {
      toast.error("Please select a withdrawal method");
      return false;
    }
    return true;
  };

  const processWithdrawal = async () => {
    if (!validateWithdrawalDetails()) {
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:3001/api/wallet/withdraw",
        {
          amount: parseFloat(amount),
          method: withdrawalMethod,
          details: withdrawalDetails,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Withdrawal response:", res.data);
      toast.success("Withdrawal request submitted successfully!");
      setAmount("");
      setShowWithdrawalModal(false);
      setWithdrawalMethod("");
      setWithdrawalDetails({
        accountNumber: "",
        ifscCode: "",
        accountName: "",
        upiId: "",
        cardNumber: "",
        cardHolderName: "",
        expiryMonth: "",
        expiryYear: "",
      });
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

  // Withdrawal modal content based on selected method
  const renderWithdrawalForm = () => {
    switch (withdrawalMethod) {
      case "bank":
        return (
          <div className="withdrawal-form-fields">
            <h4>Bank Account Details</h4>
            <div className="form-group">
              <label>Account Holder Name</label>
              <input
                type="text"
                name="accountName"
                value={withdrawalDetails.accountName}
                onChange={handleDetailChange}
                placeholder="Enter account holder name"
              />
            </div>
            <div className="form-group">
              <label>Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={withdrawalDetails.accountNumber}
                onChange={handleDetailChange}
                placeholder="Enter account number"
              />
            </div>
            <div className="form-group">
              <label>IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={withdrawalDetails.ifscCode}
                onChange={handleDetailChange}
                placeholder="Enter IFSC code"
              />
            </div>
          </div>
        );

      case "upi":
        return (
          <div className="withdrawal-form-fields">
            <h4>UPI Details</h4>
            <div className="form-group">
              <label>UPI ID</label>
              <input
                type="text"
                name="upiId"
                value={withdrawalDetails.upiId}
                onChange={handleDetailChange}
                placeholder="Enter UPI ID (e.g., name@upi)"
              />
            </div>
          </div>
        );

      case "card":
        return (
          <div className="withdrawal-form-fields">
            <h4>Card Details</h4>
            <div className="form-group">
              <label>Card Holder Name</label>
              <input
                type="text"
                name="cardHolderName"
                value={withdrawalDetails.cardHolderName}
                onChange={handleDetailChange}
                placeholder="Enter name on card"
              />
            </div>
            <div className="form-group">
              <label>Card Number</label>
              <input
                type="text"
                name="cardNumber"
                value={withdrawalDetails.cardNumber}
                onChange={handleDetailChange}
                placeholder="Enter card number"
                maxLength="16"
              />
            </div>
            <div className="form-row">
              <div className="form-group half">
                <label>Expiry Month</label>
                <select
                  name="expiryMonth"
                  value={withdrawalDetails.expiryMonth}
                  onChange={handleDetailChange}
                >
                  <option value="">MM</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1;
                    return (
                      <option
                        key={month}
                        value={month < 10 ? `0${month}` : month.toString()}
                      >
                        {month < 10 ? `0${month}` : month}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group half">
                <label>Expiry Year</label>
                <select
                  name="expiryYear"
                  value={withdrawalDetails.expiryYear}
                  onChange={handleDetailChange}
                >
                  <option value="">YYYY</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="withdrawal-method-selection">
            <h4>Select Withdrawal Method</h4>
            <div className="withdrawal-methods">
              <div
                className={`withdrawal-method ${
                  withdrawalMethod === "bank" ? "selected" : ""
                }`}
                onClick={() => setWithdrawalMethod("bank")}
              >
                <FaUniversity className="method-icon" />
                <span>Bank Account</span>
              </div>
              <div
                className={`withdrawal-method ${
                  withdrawalMethod === "upi" ? "selected" : ""
                }`}
                onClick={() => setWithdrawalMethod("upi")}
              >
                <FaQrcode className="method-icon" />
                <span>UPI</span>
              </div>
              <div
                className={`withdrawal-method ${
                  withdrawalMethod === "card" ? "selected" : ""
                }`}
                onClick={() => setWithdrawalMethod("card")}
              >
                <FaCreditCard className="method-icon" />
                <span>Card</span>
              </div>
            </div>
          </div>
        );
    }
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
              <div className="withdraw-form">
                <h3>Withdraw Money</h3>
                <div className="withdraw-form-content">
                  <p className="withdraw-description">
                    Withdraw your earnings directly to your preferred payment
                    method. We support bank transfers, UPI, and card withdrawals
                    through Razorpay.
                  </p>
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
                      disabled={
                        !amount ||
                        parseFloat(amount) <= 0 ||
                        parseFloat(amount) > walletBalance
                      }
                      className="withdraw-button"
                    >
                      <FaMoneyBillWave /> Withdraw
                    </button>
                  </div>
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
                          {transaction.method && (
                            <span className="transaction-method">
                              via {transaction.method}
                            </span>
                          )}
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
                      <div
                        className={`transaction-status status-${transaction.status}`}
                      >
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

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="withdrawal-modal-overlay">
          <div className="withdrawal-modal">
            <div className="withdrawal-modal-header">
              <h3>Withdraw Money</h3>
              <button
                className="close-modal"
                onClick={() => setShowWithdrawalModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="withdrawal-modal-content">
              <div className="withdrawal-amount">
                <span>Amount to withdraw:</span>
                <span className="amount-value">{amount} ₹</span>
              </div>

              {renderWithdrawalForm()}

              <div className="withdrawal-modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowWithdrawalModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="proceed-btn"
                  onClick={processWithdrawal}
                  disabled={!withdrawalMethod}
                >
                  {withdrawalMethod
                    ? "Proceed with Withdrawal"
                    : "Select a Method"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
