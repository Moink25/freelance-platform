const express = require("express");
const jwt = require("jsonwebtoken");
const {
  createSmartContract,
  activateSmartContract,
  completeSmartContract,
  getContractById,
  getUserContracts,
} = require("../controllers/ContractController");
const verifyToken = require("../middleware/Auth");

const router = express.Router();

// Verify JWT token middleware
const verifyTokenMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET);
    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 401,
      msg: "Authentication Failed",
    });
  }
};

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

// Get all contracts for the current user
router.get("/", async (req, res) => {
  try {
    const result = await getUserContracts(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create a new smart contract
router.post("/create", async (req, res) => {
  try {
    // Check if orderId is provided in the request body
    if (!req.body.orderId) {
      return res.status(400).json({
        status: 400,
        msg: "Order ID is required",
      });
    }

    const result = await createSmartContract(req.body.orderId);

    if (result.success) {
      res.status(201).json({
        status: 201,
        data: result.contract,
        success: true,
        msg: "Smart contract created successfully",
      });
    } else {
      res.status(400).json({
        status: 400,
        success: false,
        ...result,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      msg: error.message,
    });
  }
});

// Activate a smart contract
router.post("/activate/:contractId", async (req, res) => {
  try {
    const result = await activateSmartContract(req.params.contractId);

    if (result.success) {
      res.status(200).json({
        status: 200,
        success: true,
        data: result.contract,
        msg: "Smart contract activated successfully",
      });
    } else {
      res.status(400).json({
        status: 400,
        success: false,
        message: result.message || "Failed to activate contract",
        ...result,
      });
    }
  } catch (error) {
    console.error("Error in contract activation route:", error);
    res.status(500).json({
      status: 500,
      success: false,
      msg: error.message,
    });
  }
});

// Complete a smart contract
router.post("/complete/:contractId", async (req, res) => {
  try {
    const result = await completeSmartContract(req.params.contractId);
    res.status(200).json({
      status: 200,
      data: result,
      msg: "Smart contract completed successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      msg: error.message,
    });
  }
});

// Get contract details
router.get("/:contractId", async (req, res) => {
  try {
    const result = await getContractById(req.params.contractId);

    if (result.success) {
      res.status(200).json({
        status: 200,
        success: true,
        contract: result.contract,
        msg: "Contract details retrieved successfully",
      });
    } else {
      res.status(404).json({
        status: 404,
        success: false,
        message: result.message || "Contract not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      msg: error.message,
    });
  }
});

module.exports = router;
