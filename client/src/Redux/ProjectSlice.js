import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import myAxios from "./myAxios";

// Get all projects
export const getAllProjects = createAsyncThunk(
  "project/getAllProjects",
  async (status = "open", { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.get(`/api/projects/all?status=${status}`, {
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

// Get project details
export const getProjectById = createAsyncThunk(
  "project/getProjectById",
  async (projectId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.get(`/api/projects/${projectId}`, {
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

// Get client projects
export const getClientProjects = createAsyncThunk(
  "project/getClientProjects",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Fetching client projects from API");
      const token = localStorage.getItem("token");
      console.log("Using token:", token ? "Token exists" : "No token found");

      const res = await myAxios.get("/api/projects/client/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("API response for client projects:", res.data);
      return res.data;
    } catch (e) {
      console.error("Error in getClientProjects:", e);
      if (e.response) {
        console.error("Response data:", e.response.data);
        console.error("Response status:", e.response.status);
        return rejectWithValue(
          `Server error: ${e.response.status} - ${JSON.stringify(
            e.response.data
          )}`
        );
      }
      if (e.message === "Network Error") {
        return rejectWithValue("Network Error: Check The Server Connection");
      }
      return rejectWithValue(e.message);
    }
  }
);

// Get freelancer projects
export const getFreelancerProjects = createAsyncThunk(
  "project/getFreelancerProjects",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.get("/api/projects/freelancer/projects", {
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

// Create a new project
export const createProject = createAsyncThunk(
  "project/createProject",
  async (projectData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.post("/api/projects/create", projectData, {
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

// Submit a proposal
export const submitProposal = createAsyncThunk(
  "project/submitProposal",
  async ({ projectId, proposalData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.post(
        `/api/projects/${projectId}/proposal`,
        proposalData,
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

// Accept a proposal
export const acceptProposal = createAsyncThunk(
  "project/acceptProposal",
  async ({ projectId, proposalId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.put(
        `/api/projects/${projectId}/accept/${proposalId}`,
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

// Complete a project
export const completeProject = createAsyncThunk(
  "project/completeProject",
  async (projectId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await myAxios.put(
        `/api/projects/${projectId}/complete`,
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

const projectSlice = createSlice({
  name: "project",
  initialState: {
    allProjects: [],
    clientProjects: [],
    freelancerProjects: {
      assignedProjects: [],
      proposedProjects: [],
    },
    currentProject: null,
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearMessage: (state) => {
      state.message = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get all projects
    builder.addCase(getAllProjects.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getAllProjects.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.status === 200) {
        state.allProjects = action.payload.projects;
      } else {
        state.error = action.payload.msg;
      }
    });
    builder.addCase(getAllProjects.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Get project by id
    builder.addCase(getProjectById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getProjectById.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.status === 200) {
        state.currentProject = action.payload.project;
      } else {
        state.error = action.payload.msg;
      }
    });
    builder.addCase(getProjectById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Get client projects
    builder.addCase(getClientProjects.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getClientProjects.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.status === 200) {
        state.clientProjects = action.payload.projects;
      } else {
        state.error = action.payload.msg;
      }
    });
    builder.addCase(getClientProjects.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Get freelancer projects
    builder.addCase(getFreelancerProjects.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getFreelancerProjects.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.status === 200) {
        state.freelancerProjects = action.payload.projects;
      } else {
        state.error = action.payload.msg;
      }
    });
    builder.addCase(getFreelancerProjects.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Create project
    builder.addCase(createProject.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(createProject.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.status === 200) {
        state.message = action.payload.msg;
      } else {
        state.error = action.payload.msg;
      }
    });
    builder.addCase(createProject.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Submit proposal
    builder.addCase(submitProposal.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(submitProposal.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.status === 200) {
        state.message = action.payload.msg;
      } else {
        state.error = action.payload.msg;
      }
    });
    builder.addCase(submitProposal.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Accept proposal
    builder.addCase(acceptProposal.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(acceptProposal.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.status === 200) {
        state.message = action.payload.msg;
      } else {
        state.error = action.payload.msg;
      }
    });
    builder.addCase(acceptProposal.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Complete project
    builder.addCase(completeProject.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    });
    builder.addCase(completeProject.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.status === 200) {
        state.message = action.payload.msg;
      } else {
        state.error = action.payload.msg;
      }
    });
    builder.addCase(completeProject.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { clearMessage, clearError } = projectSlice.actions;
export default projectSlice.reducer;
