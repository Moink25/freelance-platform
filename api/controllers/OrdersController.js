const Order = require("../models/orderModel");
const { getServiceRating } = require("./TestimonialsController");
const { findServiceById } = require("./ServicesController");
const { findUserById } = require("./UserController");
const { sendMessage } = require("./ChatController");
const Service = require("../models/serviceModel");
const User = require("../models/UserModel");
const TransactionModel = require("../models/transactionModel");
const mongoose = require("mongoose");

const findOrder = async (orderId) => {
  const selectedOrder = Order.findById(orderId);
  return selectedOrder;
};

const findClientOrders = async (clientId) => {
  const selectedClient = await findUserById(clientId);
  if (selectedClient) {
    if (selectedClient.role != "client") {
      return "You Don't Have Permission";
    }
    const clientOrders = await Order.find({ clientId }).sort({ updatedAt: -1 });
    if (clientOrders.length != 0) {
      let allOrdersInfo = [];
      for (let i of clientOrders) {
        const serviceInfo = await findServiceById(i.serviceId.toString());
        const serviceRating = await getServiceRating(i.serviceId.toString());
        const serviceUserInfo = await findUserById(serviceInfo.userId);
        const ordersInfo = {
          serviceInfo,
          serviceRating,
          serviceUserInfo,
          status: i.status,
          _id: i._id,
        };
        allOrdersInfo.push(ordersInfo);
      }
      return allOrdersInfo;
    }
    return [];
  }
  return "User Doesn't Exists";
};

const findClientOrder = async (clientId, orderId) => {
  const selectedClient = await findUserById(clientId);
  if (selectedClient) {
    if (selectedClient.role != "client") {
      return "You Don't Have Permission";
    }
    const clientOrder = await findOrder(orderId);
    if (clientOrder) {
      const serviceInfo = await findServiceById(
        clientOrder.serviceId.toString()
      );
      const serviceRating = await getServiceRating(
        clientOrder.serviceId.toString()
      );
      const serviceUserInfo = await findUserById(serviceInfo.userId);
      const orderInfo = {
        serviceInfo,
        serviceRating,
        serviceUserInfo,
        status: clientOrder.status,
        _id: clientOrder._id,
      };
      return orderInfo;
    }
    return "Order Doesn't Exists";
  }
  return "User Doesn't Exists";
};

const makeOrder = async (clientId, serviceId) => {
  const selectedClient = await findUserById(clientId);
  if (selectedClient) {
    if (selectedClient.role != "client") {
      return "You Don't Have Permission";
    }
    const selectedService = await findServiceById(serviceId);
    if (selectedService) {
      const orderExists = await Order.find({
        clientId: selectedClient._id,
        serviceId: selectedService._id,
        status: "OnGoing",
      });
      if (orderExists.length != 0) {
        return "You Already Have A Uncompleted Order For This Service";
      }

      // Check client's wallet balance
      if (selectedClient.wallet < selectedService.price) {
        return "Insufficient Wallet Balance";
      }

      // Create the order
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Create the order first
        const order = new Order({
          clientId: selectedClient._id,
          serviceId: selectedService._id,
          amount: selectedService.price,
          paymentStatus: "completed", // Auto-mark as completed since payment is processed immediately
        });

        await order.save({ session });

        // Create a transaction record
        const transaction = new TransactionModel({
          userId: clientId,
          amount: selectedService.price,
          type: "payment",
          status: "completed",
          orderId: order._id,
          description: `Payment for order #${order._id} - ${selectedService.title}`,
        });

        await transaction.save({ session });

        // Update the order with transaction ID
        order.transactionId = transaction._id;
        await order.save({ session });

        // Deduct amount from client's wallet
        selectedClient.wallet -= selectedService.price;
        await selectedClient.save({ session });

        // Send a message to the freelancer
        const text = `Hello, I would like to order ${selectedService.title} service`;
        await sendMessage(clientId, selectedService.userId, text);

        await session.commitTransaction();
        session.endSession();

        // Create blockchain contract for this order
        try {
          const ContractController = require("./ContractController");
          await ContractController.createBlockchainContract(
            order._id.toString()
          );
        } catch (contractError) {
          console.error("Error creating blockchain contract:", contractError);
          // We won't fail the order creation if contract creation fails
          // In production, you might want to handle this differently
        }

        return {
          message: "Order Made Successfully",
          orderId: order._id,
        };
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    }
    return "Service Doesn't Exists";
  }
  return "User Doesn't Exists";
};

const updateOrder = async (clientId, orderId, orderState) => {
  const selectedClient = await findUserById(clientId);
  if (selectedClient) {
    if (selectedClient.role != "client") {
      return "You Don't Have Permission";
    }
    const selectedOrder = await findOrder(orderId);
    if (selectedOrder) {
      if (selectedOrder.clientId.toString() != clientId) {
        return "You Don't Have Permission";
      }
      if (orderState != "Completed" && orderState != "Cancelled") {
        return "Order Status Unrecognized";
      }

      if (orderState === "Completed") {
        // Transfer money to freelancer when order is completed
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // Get the service and freelancer information
          const service = await Service.findById(selectedOrder.serviceId);
          if (!service) {
            await session.abortTransaction();
            session.endSession();
            return "Service not found";
          }

          const freelancer = await User.findById(service.userId);
          if (!freelancer) {
            await session.abortTransaction();
            session.endSession();
            return "Freelancer not found";
          }

          // Create an earnings transaction for the freelancer
          const freelancerTransaction = new TransactionModel({
            userId: freelancer._id,
            amount: selectedOrder.amount,
            type: "earnings",
            status: "completed",
            orderId: selectedOrder._id,
            description: `Earnings from order #${selectedOrder._id}`,
          });

          await freelancerTransaction.save({ session });

          // Update freelancer's wallet balance
          freelancer.wallet += selectedOrder.amount;
          await freelancer.save({ session });

          // Update order status
          const updatedOrder = await Order.updateOne(
            { clientId, _id: orderId, status: "OnGoing" },
            {
              status: orderState,
            },
            { session }
          );

          await session.commitTransaction();
          session.endSession();

          // Complete the blockchain contract
          try {
            const ContractController = require("./ContractController");
            await ContractController.completeContract(orderId, clientId);
          } catch (contractError) {
            console.error(
              "Error completing blockchain contract:",
              contractError
            );
            // We won't fail the order completion if contract update fails
          }

          return updatedOrder;
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          throw error;
        }
      } else {
        // If cancelled, just update the status
        const updatedOrder = await Order.updateOne(
          { clientId, _id: orderId, status: "OnGoing" },
          {
            status: orderState,
          }
        );

        // Cancel the blockchain contract
        try {
          const ContractController = require("./ContractController");
          await ContractController.cancelContract(
            orderId,
            clientId,
            "Order cancelled by client"
          );
        } catch (contractError) {
          console.error("Error cancelling blockchain contract:", contractError);
          // We won't fail the order cancellation if contract update fails
        }

        return updatedOrder;
      }
    }
    return "Order doesn't exists";
  }
  return "User doesn't exists";
};

const findFreelancerOrders = async (freelancerId) => {
  const selectedFreelancer = await findUserById(freelancerId);
  if (selectedFreelancer) {
    if (selectedFreelancer.role !== "freelancer") {
      return "You Don't Have Permission";
    }

    // Find services created by this freelancer
    const freelancerServices = await Service.find({ userId: freelancerId });

    if (freelancerServices.length === 0) {
      return {
        status: 200,
        msg: "Success",
        freelancerOrders: [],
      };
    }

    // Get service IDs
    const serviceIds = freelancerServices.map((service) => service._id);

    // Find orders for these services
    const orders = await Order.find({ serviceId: { $in: serviceIds } });

    // Format the orders with details
    const formattedOrders = await Promise.all(
      orders.map(async (order) => {
        const serviceInfo = await findServiceById(order.serviceId.toString());
        const serviceRating = await getServiceRating(
          order.serviceId.toString()
        );
        const clientInfo = await findUserById(order.clientId);

        return {
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
      })
    );

    return {
      status: 200,
      msg: "Success",
      freelancerOrders: formattedOrders,
    };
  }

  return "User Doesn't Exist";
};

module.exports = {
  findClientOrder,
  findClientOrders,
  makeOrder,
  updateOrder,
  findOrder,
  findFreelancerOrders,
};
