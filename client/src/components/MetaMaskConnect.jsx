import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { updateEthereumAddress } from "../Redux/UserSlice";
import { toast } from "react-toastify";

const MetaMaskConnect = ({ isProfile = false }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.user.token);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        setErrorMessage("MetaMask is not installed. Please install MetaMask.");
        setIsConnected(false);
        return;
      }

      // Check if we're authorized to access the user's wallet
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        // Check if this account matches the stored address
        const currentAccount = accounts[0].toLowerCase();
        const storedAddress = user?.ethereumAddress?.toLowerCase();

        if (storedAddress && currentAccount !== storedAddress) {
          console.log(
            "Connected account doesn't match stored address. Showing reconnect option."
          );
          setWalletAddress(storedAddress);
          setIsConnected(false);
          setErrorMessage(
            "Current MetaMask account doesn't match your stored wallet. Please reconnect with the correct account."
          );
          return;
        }

        setWalletAddress(accounts[0]);
        setIsConnected(true);
        const chainIdHex = await ethereum.request({ method: "eth_chainId" });
        setChainId(parseInt(chainIdHex, 16));
      } else if (user?.ethereumAddress) {
        // If user has an address saved but wallet is not connected, show it as disconnected
        setWalletAddress(user.ethereumAddress);
        setIsConnected(false);
        setErrorMessage("Wallet disconnected. Please reconnect MetaMask.");
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
      setIsConnected(false);
      setErrorMessage("Error connecting to MetaMask");
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          const newAccount = accounts[0];
          setWalletAddress(newAccount);

          // Check if this is a different account from what's stored
          const storedAddress = user?.ethereumAddress?.toLowerCase();
          if (storedAddress && newAccount.toLowerCase() !== storedAddress) {
            console.log(
              "Account changed to a different address. Updating stored address."
            );
          }

          updateUserWithEthAddress(newAccount);
          setIsConnected(true);
        } else {
          // MetaMask disconnected all accounts
          setWalletAddress("");
          setIsConnected(false);
          setErrorMessage(
            "MetaMask has been locked or disconnected. Please reconnect."
          );
        }
      });

      window.ethereum.on("chainChanged", (chainIdHex) => {
        setChainId(parseInt(chainIdHex, 16));
      });

      // Connection status change
      window.ethereum.on("connect", () => {
        setIsConnected(true);
        setErrorMessage("");
      });

      window.ethereum.on("disconnect", () => {
        setIsConnected(false);
        setErrorMessage("MetaMask disconnected. Please reconnect.");
      });
    }

    return () => {
      // Cleanup listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
        window.ethereum.removeAllListeners("connect");
        window.ethereum.removeAllListeners("disconnect");
      }
    };
  }, [user]);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(""); // Clear any previous errors

      const { ethereum } = window;
      if (!ethereum) {
        setErrorMessage("MetaMask is not installed. Please install MetaMask.");
        setIsLoading(false);
        return;
      }

      console.log("Requesting MetaMask accounts...");
      // Request account access
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        setErrorMessage(
          "No accounts found. Please unlock MetaMask and try again."
        );
        setIsLoading(false);
        return;
      }

      console.log("Connected to account:", accounts[0]);
      setWalletAddress(accounts[0]);
      setIsConnected(true);

      // Check if we're on the right network (Ganache local network)
      const chainIdHex = await ethereum.request({ method: "eth_chainId" });
      const currentChainId = parseInt(chainIdHex, 16);
      console.log("Current chain ID:", currentChainId);
      setChainId(currentChainId);

      // Ganache local network has chainId 1337
      if (currentChainId !== 1337) {
        setErrorMessage("Please switch to Ganache Local Network in MetaMask");
      } else {
        console.log(
          "Connected to Ganache network, updating Ethereum address..."
        );
        // Update user in database with Ethereum address
        await updateUserWithEthAddress(accounts[0]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      setErrorMessage(`Error connecting to MetaMask: ${error.message}`);
      setIsLoading(false);
      setIsConnected(false);
    }
  };

  const reconnectWallet = async () => {
    // Clear current wallet data first
    setWalletAddress("");
    setIsConnected(false);
    setErrorMessage("");

    // Then connect again
    await connectWallet();
  };

  const switchToGanacheNetwork = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) return;

      // Try to switch to Ganache
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x539" }], // Ganache chainId in hex (1337)
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x539",
                chainName: "Ganache Local Network",
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["http://127.0.0.1:8545"],
                blockExplorerUrls: [],
              },
            ],
          });
        }
      }

      // Check the chain ID again
      const chainIdHex = await ethereum.request({ method: "eth_chainId" });
      setChainId(parseInt(chainIdHex, 16));
    } catch (error) {
      console.error("Error switching network:", error);
      setErrorMessage(`Error switching network: ${error.message}`);
    }
  };

  const updateUserWithEthAddress = async (address) => {
    try {
      if (!token) {
        console.error("No authentication token available");
        setErrorMessage("Authentication error. Please try logging in again.");
        return;
      }

      console.log("Updating Ethereum address:", address);
      setIsLoading(true);

      const response = await axios.post(
        "http://localhost:3001/user/update-ethereum-address",
        { ethereumAddress: address },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response from server:", response.data);

      if (response.data.success) {
        // Get current user info from localStorage
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));

        if (userInfo) {
          // Update the ethereumAddress directly on the userInfo object
          userInfo.ethereumAddress = address;
          localStorage.setItem("userInfo", JSON.stringify(userInfo));

          console.log("Updated userInfo in localStorage:", userInfo);
        } else {
          console.error("No userInfo found in localStorage");
        }

        // Update redux store with the new action
        dispatch(updateEthereumAddress(address));

        console.log("Ethereum address updated successfully");
        toast.success("Wallet connected successfully!");
      } else {
        console.error(
          "Failed to update Ethereum address:",
          response.data.message
        );
        setErrorMessage(`Failed to update address: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error updating Ethereum address:", error);
      if (error.response) {
        console.error("Server response:", error.response.data);
        setErrorMessage(
          `Server error: ${
            error.response.data.message || error.response.statusText
          }`
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        setErrorMessage("No response from server. Please try again.");
      } else {
        setErrorMessage(`Connection error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`meta-mask-connect ${isProfile ? "profile-wallet" : ""}`}>
      {!isProfile && <h3>Connect Your Ethereum Wallet</h3>}

      {!isProfile && (
        <p className="meta-mask-description">
          Link your MetaMask wallet to use Ethereum smart contracts for secure
          freelance agreements.
        </p>
      )}

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {walletAddress ? (
        <div className="wallet-info">
          {isProfile ? (
            <div className="profile-wallet-info">
              <div className="wallet-status">
                <span>
                  Status:{" "}
                  {isConnected ? (
                    <span className="wallet-connected">Connected</span>
                  ) : (
                    <span className="wallet-disconnected">Disconnected</span>
                  )}
                </span>
              </div>
              <div className="wallet-address">
                Address: {walletAddress.substring(0, 6)}...
                {walletAddress.substring(walletAddress.length - 4)}
              </div>

              <button
                onClick={reconnectWallet}
                className="reconnect-wallet-btn"
                disabled={isLoading}
              >
                {isLoading ? "Connecting..." : "Reconnect Wallet"}
              </button>
            </div>
          ) : (
            <>
              <p>
                Connected Wallet:{" "}
                <span className="wallet-address">
                  {walletAddress.substring(0, 6)}...
                  {walletAddress.substring(walletAddress.length - 4)}
                </span>
              </p>

              {chainId && chainId !== 1337 && (
                <div className="network-warning">
                  <p>
                    Please switch to Ganache Local Network (Chain ID: 1337) in
                    MetaMask
                  </p>
                  <button
                    className="network-switch-btn"
                    onClick={switchToGanacheNetwork}
                  >
                    Switch Network
                  </button>
                </div>
              )}

              <div className="network-badge">
                Network:{" "}
                {chainId === 1337
                  ? "Ganache Local Network"
                  : chainId
                  ? `Chain ID: ${chainId} (Unknown)`
                  : "Not Connected"}
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          className="connect-wallet-btn"
          onClick={connectWallet}
          disabled={isLoading}
        >
          {isLoading ? "Connecting..." : "Connect MetaMask"}
        </button>
      )}
    </div>
  );
};

export default MetaMaskConnect;
