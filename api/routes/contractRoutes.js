const express = require("express");
const router = express.Router();
const contractController = require("../controllers/ContractController");
const verifyToken = require("../middleware/Auth");

// Simple health check endpoint that doesn't require authentication
router.get("/status", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Contract API is running",
    timestamp: new Date().toISOString(),
  });
});

// Apply token verification middleware to all protected contract routes
router.use(verifyToken);

// Create a new blockchain contract for an order
router.post("/create/:orderId", async (req, res) => {
  try {
    const result = await contractController.createBlockchainContract(
      req.params.orderId
    );
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Complete a contract (client marks work as complete)
router.post("/complete/:orderId", async (req, res) => {
  try {
    const result = await contractController.completeContract(
      req.params.orderId,
      req.userId
    );
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Cancel a contract
router.post("/cancel/:orderId", async (req, res) => {
  try {
    const reason = req.body.reason || "No reason provided";
    const result = await contractController.cancelContract(
      req.params.orderId,
      req.userId,
      reason
    );
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Activate a contract (freelancer accepts it)
router.post("/activate/:orderId", async (req, res) => {
  try {
    const result = await contractController.activateContract(
      req.params.orderId,
      req.userId
    );
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get details of a specific contract
router.get("/:orderId", async (req, res) => {
  try {
    const result = await contractController.getContractDetails(
      req.params.orderId
    );
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all contracts for the current user
router.get("/", async (req, res) => {
  try {
    const result = await contractController.getUserContracts(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
