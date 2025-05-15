const Project = require("../models/projectModel");
const User = require("../models/UserModel");
const Contract = require("../models/contractModel");
const {
  createSmartContract,
  activateSmartContract,
} = require("./ContractController");
const { createNotification } = require("./NotificationController");
const TransactionModel = require("../models/transactionModel");

// Create a new project (for clients)
const createProject = async (userId, projectData) => {
  try {
    const user = await User.findById(userId);
    if (!user) return "User doesn't exist";
    if (user.role !== "client") return "You Don't Have Permission";

    // Format budget object
    const budget =
      typeof projectData.budget === "object"
        ? projectData.budget
        : { amount: parseFloat(projectData.budget), currency: "INR" };

    const newProject = new Project({
      ...projectData,
      budget,
      clientId: userId,
    });

    await newProject.save();
    return "Project Created Successfully";
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get all projects
const getAllProjects = async (status = "open") => {
  try {
    return await Project.find({ status })
      .populate("clientId", "name email profilePic")
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get project by ID
const getProjectById = async (projectId) => {
  try {
    return await Project.findById(projectId)
      .populate("clientId", "name email profilePic")
      .populate("assignedFreelancer", "name email profilePic")
      .populate("proposals.freelancerId", "name email profilePic");
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get client's projects
const getClientProjects = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return "User doesn't exist";
    if (user.role !== "client") return "You Don't Have Permission";

    return await Project.find({ clientId: userId })
      .populate("assignedFreelancer", "name email profilePic")
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Submit a proposal (for freelancers)
const submitProposal = async (userId, projectId, proposalData) => {
  try {
    const user = await User.findById(userId);
    if (!user) return "User doesn't exist";
    if (user.role !== "freelancer") return "You Don't Have Permission";

    const project = await Project.findById(projectId);
    if (!project) return "Project doesn't exist";
    if (project.status !== "open") return "Project is not open for proposals";

    // Check if user already submitted a proposal
    const existingProposal = project.proposals.find(
      (p) => p.freelancerId.toString() === userId.toString()
    );

    if (existingProposal)
      return "You already submitted a proposal for this project";

    // Format bidAmount object
    const bidAmount =
      typeof proposalData.bidAmount === "object"
        ? proposalData.bidAmount
        : { amount: parseFloat(proposalData.bidAmount), currency: "INR" };

    // Add proposal to project
    project.proposals.push({
      freelancerId: userId,
      proposal: proposalData.proposal,
      bidAmount,
      estimatedTime: proposalData.estimatedTime,
    });

    await project.save();

    // Create notification for the client
    await createNotification(
      project.clientId,
      "New Proposal Received",
      `You have received a new proposal for your project "${project.title}"`,
      "proposal",
      projectId,
      "project",
      `/client/${project.clientId}/project/${projectId}`
    );

    return "Proposal submitted successfully";
  } catch (error) {
    throw new Error(error.message);
  }
};

// Accept a proposal (for clients)
const acceptProposal = async (userId, projectId, proposalId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return "User doesn't exist";
    if (user.role !== "client") return "You Don't Have Permission";

    const project = await Project.findById(projectId);
    if (!project) return "Project doesn't exist";
    if (project.clientId.toString() !== userId.toString())
      return "This is not your project";
    if (project.status !== "open")
      return "Project is already assigned or closed";

    // Find the proposal
    const proposalIndex = project.proposals.findIndex(
      (p) => p._id.toString() === proposalId
    );

    if (proposalIndex === -1) return "Proposal not found";

    const proposal = project.proposals[proposalIndex];

    // Update proposal status
    project.proposals[proposalIndex].status = "accepted";

    // Update project status and assign freelancer
    project.status = "assigned";
    project.assignedFreelancer = proposal.freelancerId;

    // Update other proposals to rejected
    project.proposals.forEach((p, index) => {
      if (index !== proposalIndex) {
        p.status = "rejected";
      }
    });

    // Get the freelancer for notification and contract
    const freelancer = await User.findById(proposal.freelancerId);
    if (!freelancer) {
      throw new Error("Freelancer not found");
    }

    // Send notification to the accepted freelancer
    await createNotification(
      proposal.freelancerId,
      "Proposal Accepted",
      `Your proposal for the project "${project.title}" has been accepted!`,
      "proposal",
      projectId,
      "project",
      `/freelancer/${proposal.freelancerId}/project/${projectId}`
    );

    // Send notifications to rejected freelancers
    for (const p of project.proposals) {
      if (p._id.toString() !== proposalId) {
        await createNotification(
          p.freelancerId,
          "Proposal Not Selected",
          `Your proposal for the project "${project.title}" was not selected.`,
          "proposal",
          projectId,
          "project",
          `/freelancer/${p.freelancerId}/project/${projectId}`
        );
      }
    }

    // Create contract in blockchain
    try {
      console.log("Creating and activating contract for accepted proposal...");
      const contractData = {
        clientId: userId,
        freelancerId: proposal.freelancerId.toString(),
        projectId: projectId,
        amount: proposal.bidAmount.amount,
        currency: proposal.bidAmount.currency || "INR",
        projectTitle: project.title,
        projectDescription: project.description,
        clientName: user.username || user.name,
        freelancerName: freelancer.username || freelancer.name,
      };

      console.log("Contract data:", contractData);
      const contractResponse = await createSmartContract(contractData);
      console.log("Contract creation response:", contractResponse);

      if (contractResponse.success && contractResponse.contractId) {
        project.contractId = contractResponse.contractId;
        project.contractStatus = "created";

        // Automatically activate the contract
        try {
          console.log(
            "Attempting to activate contract:",
            contractResponse.contractId
          );
          const activationResult = await activateSmartContract(
            contractResponse.contractId
          );
          console.log("Contract activation result:", activationResult);

          if (activationResult.success) {
            project.contractStatus = "active";
            console.log("Contract activated successfully");
          } else {
            console.error(
              "Contract activation failed:",
              activationResult.message
            );
          }
        } catch (activationError) {
          console.error("Contract activation error:", activationError);
          // Continue even if activation fails, it can be activated later
        }
      } else {
        console.error("Contract creation failed:", contractResponse.message);
      }
    } catch (contractError) {
      console.error("Contract creation error:", contractError);
      // Continue even if contract creation fails, it can be created later
    }

    await project.save();
    return "Proposal accepted successfully";
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get projects for a freelancer
const getFreelancerProjects = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return "User doesn't exist";
    if (user.role !== "freelancer") return "You Don't Have Permission";

    // Get projects where freelancer is assigned
    const assignedProjects = await Project.find({
      assignedFreelancer: userId,
    }).populate("clientId", "name email profilePic");

    // Get projects where freelancer has submitted proposals
    const proposedProjects = await Project.find({
      "proposals.freelancerId": userId,
      assignedFreelancer: { $ne: userId }, // Exclude already assigned projects
    }).populate("clientId", "name email profilePic");

    return {
      assignedProjects,
      proposedProjects,
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Mark project as completed (for clients)
const completeProject = async (userId, projectId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return "User doesn't exist";
    if (user.role !== "client") return "You Don't Have Permission";

    const project = await Project.findById(projectId);
    if (!project) return "Project doesn't exist";
    if (project.clientId.toString() !== userId.toString())
      return "This is not your project";
    if (project.status !== "assigned")
      return "Project is not in assigned state";

    // Find the accepted proposal to get the payment amount
    const acceptedProposal = project.proposals.find(
      (p) => p.status === "accepted"
    );

    if (!acceptedProposal) {
      throw new Error("No accepted proposal found for this project");
    }

    // Get payment amount from the proposal
    const paymentAmount =
      typeof acceptedProposal.bidAmount === "object"
        ? parseFloat(acceptedProposal.bidAmount.amount)
        : parseFloat(acceptedProposal.bidAmount);

    // Check if client has sufficient balance
    if (user.wallet < paymentAmount) {
      return "Insufficient wallet balance to complete this project";
    }

    const freelancer = await User.findById(project.assignedFreelancer);
    if (!freelancer) {
      throw new Error("Assigned freelancer not found");
    }

    // Transfer funds from client to freelancer
    // 1. Deduct from client's wallet
    user.wallet = Number((parseFloat(user.wallet) - paymentAmount).toFixed(2));
    await user.save();

    // 2. Add to freelancer's wallet
    freelancer.wallet = Number(
      (parseFloat(freelancer.wallet) + paymentAmount).toFixed(2)
    );
    await freelancer.save();

    // 3. Create transaction records
    // Client transaction (deduction)
    const clientTransaction = new TransactionModel({
      userId: userId,
      amount: paymentAmount,
      type: "deduction",
      method: "project",
      status: "completed",
      description: `Payment for completed project: ${project.title}`,
      relatedId: projectId,
    });
    await clientTransaction.save();

    // Freelancer transaction (credit)
    const freelancerTransaction = new TransactionModel({
      userId: freelancer._id,
      amount: paymentAmount,
      type: "credit",
      method: "project",
      status: "completed",
      description: `Payment received for completed project: ${project.title}`,
      relatedId: projectId,
    });
    await freelancerTransaction.save();

    // Update project status only after successful payment
    project.status = "completed";

    // Send notifications
    // To client
    await createNotification(
      userId,
      "Project Completed",
      `You have marked the project "${project.title}" as completed and payment has been transferred to the freelancer.`,
      "project",
      project._id,
      "project",
      `/client/${userId}/project/${project._id}`
    );

    // To freelancer
    await createNotification(
      freelancer._id,
      "Payment Received",
      `The project "${project.title}" has been marked as completed. Payment of ₹${paymentAmount} has been added to your wallet.`,
      "payment",
      project._id,
      "project",
      `/freelancer/${freelancer._id}/project/${project._id}`
    );

    // If contract exists, complete it as well
    if (project.contractId) {
      try {
        // Mark contract as completed
        const completedContract = await Contract.findOneAndUpdate(
          { contractId: project.contractId },
          { status: "completed" },
          { new: true }
        );

        if (completedContract) {
          project.contractStatus = "completed";
        }
      } catch (contractError) {
        console.error("Contract completion error:", contractError);
        // Continue even if contract completion fails
      }
    }

    await project.save();
    return "Project marked as completed and payment transferred";
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  getClientProjects,
  submitProposal,
  acceptProposal,
  getFreelancerProjects,
  completeProject,
};
