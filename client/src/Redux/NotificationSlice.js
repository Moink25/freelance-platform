import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import myAxios from "./myAxios";

// Get all notifications for the current user
export const getNotifications = createAsyncThunk(
  "notification/getNotifications",
  async (page = 1, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.get(`/api/notifications?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (e) {
      if (e.message === "Network Error") {
        return rejectWithValue("Check The Server");
      }
      return rejectWithValue(e.message);
    }
  }
);

// Get unread notification count
export const getUnreadCount = createAsyncThunk(
  "notification/getUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.get("/api/notifications/unread-count", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (e) {
      if (e.message === "Network Error") {
        return rejectWithValue("Check The Server");
      }
      return rejectWithValue(e.message);
    }
  }
);

// Mark notification as read
export const markAsRead = createAsyncThunk(
  "notification/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.put(
        `/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return { notificationId, response: res.data };
    } catch (e) {
      if (e.message === "Network Error") {
        return rejectWithValue("Check The Server");
      }
      return rejectWithValue(e.message);
    }
  }
);

// Mark all notifications as read
export const markAllAsRead = createAsyncThunk(
  "notification/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.put(
        "/api/notifications/mark-all-read",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data;
    } catch (e) {
      if (e.message === "Network Error") {
        return rejectWithValue("Check The Server");
      }
      return rejectWithValue(e.message);
    }
  }
);

// Delete a notification
export const deleteNotification = createAsyncThunk(
  "notification/deleteNotification",
  async (notificationId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.delete(`/api/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return { notificationId, response: res.data };
    } catch (e) {
      if (e.message === "Network Error") {
        return rejectWithValue("Check The Server");
      }
      return rejectWithValue(e.message);
    }
  }
);

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    notifications: [],
    totalCount: 0,
    unreadCount: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get notifications
    builder.addCase(getNotifications.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getNotifications.fulfilled, (state, action) => {
      state.loading = false;
      state.notifications = action.payload.notifications;
      state.totalCount = action.payload.total;
      state.unreadCount = action.payload.unreadCount;
      state.currentPage = action.payload.currentPage;
      state.totalPages = action.payload.totalPages;
    });
    builder.addCase(getNotifications.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Get unread count
    builder.addCase(getUnreadCount.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUnreadCount.fulfilled, (state, action) => {
      state.loading = false;
      state.unreadCount = action.payload.unreadCount;
    });
    builder.addCase(getUnreadCount.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Mark as read
    builder.addCase(markAsRead.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      state.loading = false;
      state.notifications = state.notifications.map((notification) =>
        notification._id === action.payload.notificationId
          ? { ...notification, isRead: true }
          : notification
      );
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    });
    builder.addCase(markAsRead.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Mark all as read
    builder.addCase(markAllAsRead.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(markAllAsRead.fulfilled, (state) => {
      state.loading = false;
      state.notifications = state.notifications.map((notification) => ({
        ...notification,
        isRead: true,
      }));
      state.unreadCount = 0;
    });
    builder.addCase(markAllAsRead.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Delete notification
    builder.addCase(deleteNotification.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteNotification.fulfilled, (state, action) => {
      state.loading = false;
      state.notifications = state.notifications.filter(
        (notification) => notification._id !== action.payload.notificationId
      );
      // Adjust unread count if the deleted notification was unread
      const deletedNotification = state.notifications.find(
        (notification) => notification._id === action.payload.notificationId
      );
      if (deletedNotification && !deletedNotification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.totalCount = Math.max(0, state.totalCount - 1);
    });
    builder.addCase(deleteNotification.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { clearError } = notificationSlice.actions;
export default notificationSlice.reducer;
