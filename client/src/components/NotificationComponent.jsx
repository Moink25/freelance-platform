import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../Redux/NotificationSlice";
import { useNavigate } from "react-router-dom";
import { BsBell, BsBellFill } from "react-icons/bs";
import moment from "moment";
import "./Notification.css";

export default function NotificationComponent() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { notifications, unreadCount, loading } = useSelector(
    (state) => state.notification
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Load notifications and unread count when component mounts
    dispatch(getUnreadCount());
    dispatch(getNotifications(1));

    // Set up polling to refresh unread count every minute
    const interval = setInterval(() => {
      dispatch(getUnreadCount());
    }, 60000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.isRead) {
      dispatch(markAsRead(notification._id));
    }

    // Navigate to the relevant page if link is provided
    if (notification.link) {
      navigate(notification.link);
    }

    setShowDropdown(false);
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "message":
        return "💬";
      case "proposal":
        return "📄";
      case "project":
        return "📁";
      case "payment":
        return "💰";
      default:
        return "🔔";
    }
  };

  const formatTimeAgo = (date) => {
    return moment(date).fromNow();
  };

  return (
    <div className="notification-icon" ref={dropdownRef}>
      <div onClick={() => setShowDropdown(!showDropdown)}>
        {unreadCount > 0 ? <BsBellFill /> : <BsBell />}
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead}>Mark all as read</button>
            )}
          </div>

          {loading ? (
            <div className="notification-loading">Loading...</div>
          ) : notifications.length > 0 ? (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${
                    !notification.isRead ? "unread" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon-type">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                    <div className="time">
                      {formatTimeAgo(notification.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              <div
                className="view-all"
                onClick={() => navigate("/notifications")}
              >
                View All
              </div>
            </>
          ) : (
            <div className="notification-empty">
              No notifications to display
            </div>
          )}
        </div>
      )}
    </div>
  );
}
