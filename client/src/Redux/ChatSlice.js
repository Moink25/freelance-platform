import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import myAxios from "./myAxios";

export const myConversations = createAsyncThunk(
  "client/myConversations",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.get("/chat/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (e) {
      if (e.message == "Network Error") {
        return rejectWithValue("Check The Server");
      }
    }
  }
);

export const conversationMessages = createAsyncThunk(
  "client/conversationMessages",
  async (chatId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.get(`/chat/messages/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (e) {
      if (e.message == "Network Error") {
        return rejectWithValue("Check The Server");
      }
    }
  }
);

export const sendMessage = createAsyncThunk(
  "client/sendMessage",
  async ({ receiver, text }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.post(
        `/chat/sendMessage`,
        { receiver, text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data;
    } catch (e) {
      if (e.message == "Network Error") {
        return rejectWithValue("Check The Server");
      }
    }
  }
);

export const getChatSuggestion = createAsyncThunk(
  "client/getChatSuggestion",
  async ({ chatId, messageText }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.post(
        `/chat/suggestion`,
        { chatId, messageText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data;
    } catch (e) {
      if (e.message == "Network Error") {
        return rejectWithValue("Check The Server");
      }
      return rejectWithValue(e.message);
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    data: [],
    messages: [],
    suggestion: "",
    isLoadingSuggestion: false,
    suggestionError: null,
    error: null,
  },
  reducers: {
    setNewMessages: (state, action) => {
      state.messages.conversationMessages =
        state.messages.messages.conversationMessages.push(action.payload);
    },
    clearSuggestion: (state) => {
      state.suggestion = "";
      state.suggestionError = null;
    },
  },
  extraReducers: (builder) => {
    // Get User Conversations
    builder.addCase(myConversations.fulfilled, (state, action) => {
      state.data = action.payload;
    });
    builder.addCase(myConversations.rejected, (state, action) => {
      state.error = action.payload;
    });

    // Get Converation Message
    builder.addCase(conversationMessages.fulfilled, (state, action) => {
      state.messages = action.payload;
    });
    builder.addCase(conversationMessages.rejected, (state, action) => {
      state.error = action.payload;
    });

    // Get AI chat suggestion
    builder.addCase(getChatSuggestion.pending, (state) => {
      state.isLoadingSuggestion = true;
      state.suggestionError = null;
    });
    builder.addCase(getChatSuggestion.fulfilled, (state, action) => {
      state.isLoadingSuggestion = false;
      state.suggestion = action.payload.suggestion;
    });
    builder.addCase(getChatSuggestion.rejected, (state, action) => {
      state.isLoadingSuggestion = false;
      state.suggestionError = action.payload;
    });
  },
});

export const { setNewMessages, clearSuggestion } = chatSlice.actions;
export default chatSlice.reducer;
