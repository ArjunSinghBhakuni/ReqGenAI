import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from "react";
import { notificationAPI } from "../services/api";

const NotificationContext = createContext();

// Notification reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.payload, loading: false };
    case "SET_UNREAD_COUNT":
      return { ...state, unreadCount: action.payload };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
        newNotification: action.payload, // Track new notification for sound
      };
    case "MARK_AS_READ":
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.notificationId === action.payload
            ? { ...notification, status: "read", readAt: new Date() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case "MARK_ALL_AS_READ":
      return {
        ...state,
        notifications: state.notifications.map((notification) => ({
          ...notification,
          status: "read",
          readAt: new Date(),
        })),
        unreadCount: 0,
      };
    case "ARCHIVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.notificationId !== action.payload
        ),
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "CLEAR_NEW_NOTIFICATION":
      return { ...state, newNotification: null };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  newNotification: null,
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const pollingIntervalRef = useRef(null);
  const previousUnreadCountRef = useRef(0);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log("Could not play notification sound:", error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const response = await notificationAPI.getAll();

      if (response.data.success) {
        dispatch({ type: "SET_NOTIFICATIONS", payload: response.data.data });
      } else {
        throw new Error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      dispatch({
        type: "SET_ERROR",
        payload:
          error.response?.data?.message || "Failed to fetch notifications",
      });
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();

      if (response.data.success) {
        const newCount = response.data.count;
        const previousCount = previousUnreadCountRef.current;

        // If count increased, we have new notifications
        if (newCount > previousCount && previousCount > 0) {
          // Fetch the latest notification to play sound
          const notificationsResponse = await notificationAPI.getAll(userId);
          if (
            notificationsResponse.data.success &&
            notificationsResponse.data.data.length > 0
          ) {
            const latestNotification = notificationsResponse.data.data[0];
            dispatch({ type: "ADD_NOTIFICATION", payload: latestNotification });
            playNotificationSound();
          }
        }

        dispatch({ type: "SET_UNREAD_COUNT", payload: newCount });
        previousUnreadCountRef.current = newCount;
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationAPI.markAsRead(notificationId);

      if (response.data.success) {
        dispatch({ type: "MARK_AS_READ", payload: notificationId });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await notificationAPI.markAllAsRead();

      if (response.data.success) {
        dispatch({ type: "MARK_ALL_AS_READ" });
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Archive notification
  const archiveNotification = async (notificationId) => {
    try {
      const response = await notificationAPI.archive(notificationId);

      if (response.data.success) {
        dispatch({ type: "ARCHIVE_NOTIFICATION", payload: notificationId });
      }
    } catch (error) {
      console.error("Error archiving notification:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (notification.status === "unread") {
      await markAsRead(notification.notificationId);
    }

    // Navigate to project page directly
    if (notification.projectId) {
      // Use React Router navigation instead of window.location.href
      window.location.href = `/project/${notification.projectId}`;
    }
  };

  // Poll for new notifications (real-time updates)
  const startPolling = (interval = 5000) => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Start new polling
    pollingIntervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, interval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Load initial data only (no polling)
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  // Clear new notification after a delay
  useEffect(() => {
    if (state.newNotification) {
      const timer = setTimeout(() => {
        dispatch({ type: "CLEAR_NEW_NOTIFICATION" });
      }, 3000); // Clear after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [state.newNotification]);

  const value = {
    ...state,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    handleNotificationClick,
    startPolling,
    stopPolling,
    playNotificationSound,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export default NotificationContext;
