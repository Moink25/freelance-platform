import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { tokenExists } from "../../Redux/UserSlice";
import {
  getProjectById,
  acceptProposal,
  completeProject,
  clearMessage,
  clearError,
} from "../../Redux/ProjectSlice";
import { toast } from "react-toastify";
import ClientMenu from "./ClientMenu";
import Loading from "../Loading";
import moment from "moment";
import noImage from "../../assets/Images/no-image.png";
import axios from "axios";

export default function ClientProjectDetails() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const { token } = useSelector((state) => state.user);
  const { currentProject, error, message } = useSelector(
    (state) => state.project
  );
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id, projectId } = useParams();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    // Validate user is logged in and has correct role
    tokenExists(token, navigate, dispatch).then((data) => {
      if (data === false || userInfo._id !== id || userInfo.role !== "client") {
        navigate("/login");
      }
    });

    loadProjectDetails();
    fetchWalletBalance();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
      setActionLoading(false);
    }
    if (message) {
      toast.success(message);
      dispatch(clearMessage());
      loadProjectDetails();
      setActionLoading(false);
    }
  }, [error, message]);

  const loadProjectDetails = () => {
    setLoading(true);
    dispatch(getProjectById(projectId))
      .unwrap()
      .then(() => {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      })
      .catch((rejectedValueOrSerializedError) => {
        setTimeout(() => {
          setLoading(false);
          toast.error(rejectedValueOrSerializedError);
        }, 500);
      });
  };

  const handleAcceptProposal = (proposalId) => {
    if (
      window.confirm(
        "Are you sure you want to accept this proposal? This will assign the project to this freelancer."
      )
    ) {
      setActionLoading(true);
      dispatch(acceptProposal({ projectId, proposalId }));
    }
  };

  const handleCompleteProject = () => {
    if (
      window.confirm(
        "Are you sure you want to mark this project as completed? This will transfer the agreed payment amount from your wallet to the freelancer."
      )
    ) {
      setActionLoading(true);
      dispatch(completeProject(projectId))
        .unwrap()
        .then((response) => {
          setActionLoading(false);
          if (response.status === 200) {
            toast.success(response.msg);
            // Refresh project details and wallet balance
            loadProjectDetails();
            fetchWalletBalance();
          } else {
            toast.error(response.msg);
          }
        })
        .catch((error) => {
          setActionLoading(false);
          toast.error(error.toString());
        });
    }
  };

  // Fetch the client's wallet balance
  const fetchWalletBalance = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/wallet/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWalletBalance(res.data.balance);
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  };

  // Get the payment amount that will be transferred
  const getPaymentAmount = () => {
    if (!currentProject || !currentProject.proposals) return 0;

    const acceptedProposal = currentProject.proposals.find(
      (p) => p.status === "accepted"
    );

    if (!acceptedProposal) return 0;

    // Ensure we properly parse the bid amount as a number
    return typeof acceptedProposal.bidAmount === "object"
      ? parseFloat(acceptedProposal.bidAmount.amount)
      : parseFloat(acceptedProposal.bidAmount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "open":
        return <span className="badge green">Open</span>;
      case "assigned":
        return <span className="badge blue">In Progress</span>;
      case "completed":
        return <span className="badge purple">Completed</span>;
      case "cancelled":
        return <span className="badge red">Cancelled</span>;
      default:
        return <span className="badge">Unknown</span>;
    }
  };

  const getProposalStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="badge yellow">Pending</span>;
      case "accepted":
        return <span className="badge green">Accepted</span>;
      case "rejected":
        return <span className="badge red">Rejected</span>;
      default:
        return <span className="badge">Unknown</span>;
    }
  };

  // Format budget to handle both old and new budget structure
  const formatBudget = (budget) => {
    if (!budget) return "N/A";

    // Handle both old and new budget structure
    if (typeof budget === "object") {
      return `₹${budget.amount?.toLocaleString() || 0} ${
        budget.currency !== "INR" ? budget.currency : ""
      }`;
    } else {
      return `₹${parseFloat(budget).toLocaleString()}`;
    }
  };

  return (
    <>
      {loading && <Loading />}
      {actionLoading && <Loading />}

      {currentProject && (
        <div className="projectDetails">
          <div className="container">
            <div className="section">
              <div className="projectHeader">
                <div className="backLink">
                  <Link to={`/client/${id}/projects`}>
                    &larr; Back to Projects
                  </Link>
                </div>

                <div className="projectTitleSection">
                  <h2>{currentProject.title}</h2>
                  {getStatusBadge(currentProject.status)}
                </div>

                <div className="projectMeta">
                  <div className="metaItem">
                    <span className="metaLabel">Posted:</span>
                    <span className="metaValue">
                      {moment(currentProject.createdAt).format("MMM D, YYYY")}
                    </span>
                  </div>
                  <div className="metaItem">
                    <span className="metaLabel">Budget:</span>
                    <span className="metaValue">
                      {formatBudget(currentProject.budget)}
                    </span>
                  </div>
                  {currentProject.deadline && (
                    <div className="metaItem">
                      <span className="metaLabel">Deadline:</span>
                      <span className="metaValue">
                        {moment(currentProject.deadline).format("MMM D, YYYY")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="projectContent">
                <div className="projectDescription">
                  <h3>Project Description</h3>
                  <p>{currentProject.description}</p>

                  {currentProject.skills &&
                    currentProject.skills.length > 0 && (
                      <div className="skillsSection">
                        <h4>Skills Required</h4>
                        <div className="skillTags">
                          {currentProject.skills.map((skill, index) => (
                            <div key={index} className="skillTag">
                              {skill}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {currentProject.status === "assigned" &&
                  currentProject.assignedFreelancer && (
                    <div className="assignedFreelancer">
                      <h3>Assigned Freelancer</h3>
                      <div className="freelancerCard">
                        <img
                          src={
                            currentProject.assignedFreelancer.profilePic ===
                            "no-image.png"
                              ? noImage
                              : `http://localhost:3001/ProfilePic/${currentProject.assignedFreelancer.profilePic}`
                          }
                          alt="Freelancer"
                        />
                        <div className="freelancerInfo">
                          <h4>{currentProject.assignedFreelancer.name}</h4>
                          <p>{currentProject.assignedFreelancer.email}</p>
                          <button
                            className="chatButton"
                            onClick={() =>
                              navigate(
                                `/client/${id}/messages/${currentProject.assignedFreelancer._id}`
                              )
                            }
                          >
                            Message Freelancer
                          </button>
                        </div>

                        <div className="projectActions">
                          <div className="walletInfo">
                            <p>
                              <strong>
                                Your wallet balance: ₹
                                {walletBalance.toLocaleString()}
                              </strong>
                            </p>
                            <p className="paymentNote">
                              Payment amount: ₹
                              {getPaymentAmount().toLocaleString()} will be
                              transferred when marking as complete.
                            </p>
                            {walletBalance < getPaymentAmount() && (
                              <p className="error-message">
                                Insufficient wallet balance! Please add funds to
                                your wallet before completing this project.
                              </p>
                            )}
                          </div>
                          <button
                            className="completeButton"
                            onClick={handleCompleteProject}
                            disabled={
                              currentProject.status !== "assigned" ||
                              walletBalance < getPaymentAmount()
                            }
                          >
                            Mark as Completed
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                {currentProject.proposals &&
                currentProject.proposals.length > 0 ? (
                  <div className="proposalsSection">
                    <h3>
                      Proposals ({currentProject.proposals.length})
                      {currentProject.status === "open" &&
                        " - Select a freelancer for your project"}
                    </h3>

                    <div className="proposalsList">
                      {currentProject.proposals.map((proposal) => (
                        <div
                          key={proposal._id}
                          className={`proposalCard ${
                            proposal.status === "accepted" ? "accepted" : ""
                          }`}
                        >
                          <div className="proposalHeader">
                            <div className="freelancerBasic">
                              <div>
                                <h4>{proposal.freelancerId.name}</h4>
                                <p>{proposal.freelancerId.email}</p>
                              </div>
                            </div>
                            {getProposalStatusBadge(proposal.status)}
                          </div>

                          <div className="proposalContent">
                            <div className="proposalDetails">
                              <div className="detailItem">
                                <span className="detailLabel">Bid Amount:</span>
                                <span className="detailValue">
                                  {formatBudget(proposal.bidAmount)}
                                </span>
                              </div>
                              <div className="detailItem">
                                <span className="detailLabel">
                                  Estimated Time:
                                </span>
                                <span className="detailValue">
                                  {proposal.estimatedTime}
                                </span>
                              </div>
                              <div className="detailItem">
                                <span className="detailLabel">Submitted:</span>
                                <span className="detailValue">
                                  {moment(proposal.submittedAt).fromNow()}
                                </span>
                              </div>
                            </div>

                            <div className="proposalMessage">
                              <h5>Proposal</h5>
                              <p>{proposal.proposal}</p>
                            </div>

                            {currentProject.status === "open" &&
                              proposal.status === "pending" && (
                                <div className="proposalActions">
                                  <button
                                    className="acceptButton"
                                    onClick={() =>
                                      handleAcceptProposal(proposal._id)
                                    }
                                  >
                                    Accept Proposal
                                  </button>
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="noProposals">
                    <h3>Proposals (0)</h3>
                    <p>
                      No proposals yet. Freelancers will be able to submit
                      proposals for your project.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <ClientMenu active="projects" />
          </div>
        </div>
      )}
    </>
  );
}
