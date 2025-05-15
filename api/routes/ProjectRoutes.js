const express = require("express");
const {
  createProject,
  getAllProjects,
  getProjectById,
  getClientProjects,
  submitProposal,
  acceptProposal,
  getFreelancerProjects,
  completeProject,
} = require("../controllers/ProjectController");
const VerifyToken = require("../middleware/Auth");
const route = express.Router();

// Get all projects (open by default)
route.get("/all", VerifyToken, async (req, res) => {
  try {
    const status = req.query.status || "open";
    const projects = await getAllProjects(status);
    return res.json({ status: 200, projects });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occurred: " + error.message });
  }
});

// Get project by id
route.get("/:projectId", VerifyToken, async (req, res) => {
  try {
    const project = await getProjectById(req.params.projectId);
    if (!project) {
      return res.json({ status: 404, msg: "Project not found" });
    }
    return res.json({ status: 200, project });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occurred: " + error.message });
  }
});

// Get client's projects
route.get("/client/projects", VerifyToken, async (req, res) => {
  try {
    const projects = await getClientProjects(req.userId);
    if (projects === "User doesn't exist") {
      return res.json({ status: 404, msg: projects });
    }
    if (projects === "You Don't Have Permission") {
      return res.json({ status: 403, msg: projects });
    }
    return res.json({ status: 200, projects });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occurred: " + error.message });
  }
});

// Get freelancer's projects (both assigned and proposals)
route.get("/freelancer/projects", VerifyToken, async (req, res) => {
  try {
    const projects = await getFreelancerProjects(req.userId);
    if (projects === "User doesn't exist") {
      return res.json({ status: 404, msg: projects });
    }
    if (projects === "You Don't Have Permission") {
      return res.json({ status: 403, msg: projects });
    }
    return res.json({ status: 200, projects });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occurred: " + error.message });
  }
});

// Create a new project (client only)
route.post("/create", VerifyToken, async (req, res) => {
  try {
    const result = await createProject(req.userId, req.body);
    if (result === "User doesn't exist") {
      return res.json({ status: 404, msg: result });
    }
    if (result === "You Don't Have Permission") {
      return res.json({ status: 403, msg: result });
    }
    return res.json({ status: 200, msg: result });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occurred: " + error.message });
  }
});

// Submit a proposal for a project (freelancer only)
route.post("/:projectId/proposal", VerifyToken, async (req, res) => {
  try {
    const result = await submitProposal(
      req.userId,
      req.params.projectId,
      req.body
    );
    if (result === "User doesn't exist" || result === "Project doesn't exist") {
      return res.json({ status: 404, msg: result });
    }
    if (result === "You Don't Have Permission") {
      return res.json({ status: 403, msg: result });
    }
    if (
      result === "Project is not open for proposals" ||
      result === "You already submitted a proposal for this project"
    ) {
      return res.json({ status: 400, msg: result });
    }
    return res.json({ status: 200, msg: result });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occurred: " + error.message });
  }
});

// Accept a proposal (client only)
route.put("/:projectId/accept/:proposalId", VerifyToken, async (req, res) => {
  try {
    const result = await acceptProposal(
      req.userId,
      req.params.projectId,
      req.params.proposalId
    );
    if (
      result === "User doesn't exist" ||
      result === "Project doesn't exist" ||
      result === "Proposal not found"
    ) {
      return res.json({ status: 404, msg: result });
    }
    if (
      result === "You Don't Have Permission" ||
      result === "This is not your project"
    ) {
      return res.json({ status: 403, msg: result });
    }
    if (result === "Project is already assigned or closed") {
      return res.json({ status: 400, msg: result });
    }
    return res.json({ status: 200, msg: result });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occurred: " + error.message });
  }
});

// Complete a project (client only)
route.put("/:projectId/complete", VerifyToken, async (req, res) => {
  try {
    const result = await completeProject(req.userId, req.params.projectId);
    if (result === "User doesn't exist" || result === "Project doesn't exist") {
      return res.json({ status: 404, msg: result });
    }
    if (
      result === "You Don't Have Permission" ||
      result === "This is not your project"
    ) {
      return res.json({ status: 403, msg: result });
    }
    if (result === "Project is not in assigned state") {
      return res.json({ status: 400, msg: result });
    }
    if (result === "Insufficient wallet balance to complete this project") {
      return res.json({ status: 400, msg: result });
    }
    return res.json({ status: 200, msg: result });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occurred: " + error.message });
  }
});

module.exports = route;
