const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/NotificationController");
const VerifyToken = require("../middleware/Auth");

// Apply authentication middleware to all routes
router.use(VerifyToken);

// Get all notifications for the current user
router.get("/", NotificationController.getUserNotifications);

// Get unread notification count
router.get("/unread-count", NotificationController.getUnreadCount);

// Mark a notification as read
router.put("/:notificationId/read", NotificationController.markAsRead);

// Mark all notifications as read
router.put("/mark-all-read", NotificationController.markAllAsRead);

// Delete a notification
router.delete("/:notificationId", NotificationController.deleteNotification);

module.exports = router;
