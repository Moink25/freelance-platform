const express = require("express");
const { freelancerDashboard } = require("../controllers/DashboardController");
const {
  findUserServices,
  findServiceById,
  createService,
  deleteService,
  updateService,
} = require("../controllers/ServicesController");
const { findFreelancerOrders } = require("../controllers/OrdersController");
const { findUserById } = require("../controllers/UserController");
const { getServiceRating } = require("../controllers/TestimonialsController");
const VerifyToken = require("../middleware/Auth");
const { createServiceUpload } = require("../middleware/uploadImage");
const Service = require("../models/serviceModel");
const Order = require("../models/orderModel");
const route = express.Router();

route.get("/dashboard", VerifyToken, async (req, res) => {
  try {
    const dashboard = await freelancerDashboard(req.userId);
    if (dashboard == "User doesn't exist") {
      return res.json({ status: 404, msg: dashboard });
    } else if (dashboard == "You Don't Have Permission") {
      return res.json({ status: 403, msg: dashboard });
    } else {
      return res.json({ status: 200, dashboard });
    }
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occured: " + error.message });
  }
});

route.get("/myServices", VerifyToken, async (req, res) => {
  try {
    const allServices = await findUserServices(req.userId);
    if (allServices !== null) {
      return res.json({ allServices: allServices || [], status: 200 });
    }
    return res.json({ msg: "User Doesn't Exist", status: 404 });
  } catch (error) {
    console.error("Error in myServices route:", error);
    return res.json({ status: 505, msg: "Error Occurred: " + error.message });
  }
});

route.get("/service/:idService", VerifyToken, async (req, res) => {
  try {
    const selectedService = await findServiceById(req.params.idService);
    if (selectedService) {
      return res.json({ selectedService, status: 200 });
    }
    return res.json({ msg: "Service Not Found", status: 404 });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occured: " + error.message });
  }
});

route.post("/service", VerifyToken, createServiceUpload, async (req, res) => {
  try {
    if (req.files.length == 0) {
      return res.json({
        msg: "You should select at least 3 images",
        status: 400,
      });
    }
    const images = req.files.map((image) => image.filename);
    const { title, description, price } = req.body;
    const createdService = await createService(
      title,
      description,
      price,
      req.userId,
      images
    );
    if (createdService) {
      return res.json({ msg: "Service Created Successfully", status: 200 });
    }
    return res.json({
      msg: "You Already Have This Service Gig",
      status: 409,
    });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occured: " + error.message });
  }
});

route.put(
  "/service/:idService",
  VerifyToken,
  createServiceUpload,
  async (req, res) => {
    try {
      if (req.files.length == 0) {
        return res.json({
          msg: "You should select at least 3 images",
          status: 400,
        });
      }
      const images = req.files.map((image) => image.filename);
      const { title, description, price } = req.body;
      const updatedService = await updateService(
        title,
        description,
        price,
        req.userId,
        images,
        req.params.idService
      );
      switch (updatedService) {
        case "User Doesn't exists":
        case "Service doesn't exists":
          return res.json({ msg: updatedService, status: 404 });
        case "This service doesn't belongs to you":
          return res.json({ msg: updatedService, status: 403 });
        case "Service gig already exists":
          return res.json({ msg: updatedService, status: 409 });
        default:
          return res.json({ msg: updatedService, status: 200 });
      }
    } catch (error) {
      return res.json({ status: 505, msg: "Error Occured: " + error.message });
    }
  }
);

route.delete("/service/:idService", VerifyToken, async (req, res) => {
  try {
    const deletedService = await deleteService(
      req.userId,
      req.params.idService
    );
    if (deletedService) {
      if (deletedService == 1) {
        return res.json({ status: 404, msg: "Service doesn't exists" });
      } else if (deletedService == -1) {
        return res.json({
          status: 403,
          msg: "This service doesn't belongs to you",
        });
      }
      return res.json({ status: 200, msg: "Service Deleted Successfully" });
    }
    return res.json({ status: 404, msg: "User Doesn't exists" });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occured: " + error.message });
  }
});

route.get("/orders", VerifyToken, async (req, res) => {
  try {
    const freelancerOrders = await findFreelancerOrders(req.userId);

    if (typeof freelancerOrders === "string") {
      if (freelancerOrders === "You Don't Have Permission") {
        return res.json({ status: 403, msg: freelancerOrders });
      } else {
        return res.json({ status: 404, msg: freelancerOrders });
      }
    }

    return res.json(freelancerOrders);
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occurred: " + error.message });
  }
});

route.get("/order/:orderId", VerifyToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.userId;

    // First, find all services by this freelancer
    const freelancerServices = await Service.find({ userId });
    if (freelancerServices.length === 0) {
      return res.json({
        status: 404,
        msg: "No services found for this freelancer",
      });
    }

    // Get service IDs
    const serviceIds = freelancerServices.map((service) => service._id);

    // Find the specific order that belongs to one of the freelancer's services
    const order = await Order.findOne({
      _id: orderId,
      serviceId: { $in: serviceIds },
    });

    if (!order) {
      return res.json({
        status: 404,
        msg: "Order not found or does not belong to your services",
      });
    }

    // Get additional details
    const serviceInfo = await findServiceById(order.serviceId.toString());
    const serviceRating = await getServiceRating(order.serviceId.toString());
    const clientInfo = await findUserById(order.clientId);

    const orderDetails = {
      _id: order._id,
      serviceInfo,
      serviceRating,
      clientInfo: {
        _id: clientInfo._id,
        username: clientInfo.username,
        profileImg: clientInfo.profileImg,
      },
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    };

    return res.json({
      status: 200,
      msg: "Success",
      orderDetails,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return res.json({
      status: 505,
      msg: "Error occurred: " + error.message,
    });
  }
});

route.post("/create-contract/:orderId", VerifyToken, async (req, res) => {
  try {
    const contractController = require("../controllers/ContractController");
    const result = await contractController.createBlockchainContract(
      req.params.orderId
    );

    if (result.success) {
      return res.json({
        status: 200,
        msg: "Contract created successfully",
        contract: result.contract,
      });
    } else {
      return res.json({
        status: 400,
        msg: result.message,
      });
    }
  } catch (error) {
    console.error("Error creating contract:", error);
    return res.json({
      status: 505,
      msg: "Error occurred: " + error.message,
    });
  }
});

route.post("/activate-contract/:orderId", VerifyToken, async (req, res) => {
  try {
    const contractController = require("../controllers/ContractController");
    const result = await contractController.activateContract(
      req.params.orderId,
      req.userId
    );

    if (result.success) {
      return res.json({
        status: 200,
        msg: "Contract activated successfully",
        contract: result.contract,
      });
    } else {
      return res.json({
        status: 400,
        msg: result.message,
      });
    }
  } catch (error) {
    console.error("Error activating contract:", error);
    return res.json({
      status: 505,
      msg: "Error occurred: " + error.message,
    });
  }
});

module.exports = route;
