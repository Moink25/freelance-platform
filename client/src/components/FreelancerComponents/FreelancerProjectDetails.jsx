import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { tokenExists } from "../../Redux/UserSlice";
import {
  getProjectById,
  submitProposal,
  clearMessage,
  clearError,
} from "../../Redux/ProjectSlice";
import { toast } from "react-toastify";
import FreelancerMenu from "./FreelancerMenu";
import Loading from "../Loading";
import moment from "moment";
import noImage from "../../assets/Images/no-image.png";

export default function FreelancerProjectDetails() {
  const [loading, setLoading] = useState(true);
  const [proposalData, setProposalData] = useState({
    proposal: "",
    bidAmount: {
      amount: "",
      currency: "INR",
    },
    estimatedTime: "",
  });
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
      if (
        data === false ||
        userInfo._id !== id ||
        userInfo.role !== "freelancer"
      ) {
        navigate("/login");
      }
    });

    loadProjectDetails();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
      setLoading(false);
    }
    if (message) {
      toast.success(message);
      dispatch(clearMessage());
      loadProjectDetails();
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "bidAmount") {
      setProposalData({
        ...proposalData,
        bidAmount: {
          ...proposalData.bidAmount,
          amount: value,
        },
      });
    } else {
      setProposalData({
        ...proposalData,
        [name]: value,
      });
    }
  };

  const handleSubmitProposal = (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !proposalData.proposal.trim() ||
      !proposalData.bidAmount.amount ||
      !proposalData.estimatedTime.trim()
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    // Prepare data with correct types
    const data = {
      ...proposalData,
      bidAmount: {
        ...proposalData.bidAmount,
        amount: parseFloat(proposalData.bidAmount.amount),
      },
    };

    dispatch(submitProposal({ projectId, proposalData: data }))
      .unwrap()
      .catch(() => {
        setLoading(false);
      });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "open":
        return <span className="status open">Open</span>;
      case "assigned":
        return <span className="status assigned">Assigned</span>;
      case "completed":
        return <span className="status completed">Completed</span>;
      case "cancelled":
        return <span className="status cancelled">Cancelled</span>;
      default:
        return null;
    }
  };

  const hasSubmittedProposal = () => {
    if (!currentProject || !currentProject.proposals) return false;

    return currentProject.proposals.some(
      (p) => p.freelancerId._id === id || p.freelancerId === id
    );
  };

  const isAssignedToMe = () => {
    if (!currentProject || !currentProject.assignedFreelancer) return false;

    return (
      currentProject.assignedFreelancer._id === id ||
      currentProject.assignedFreelancer === id
    );
  };

  const getMyProposal = () => {
    if (!currentProject || !currentProject.proposals) return null;

    return currentProject.proposals.find(
      (p) => p.freelancerId._id === id || p.freelancerId === id
    );
  };

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

  const formatBidAmount = (bidAmount) => {
    if (!bidAmount) return "N/A";

    // Handle both old and new bidAmount structure
    if (typeof bidAmount === "object") {
      return `₹${bidAmount.amount?.toLocaleString() || 0} ${
        bidAmount.currency !== "INR" ? bidAmount.currency : ""
      }`;
    } else {
      return `₹${parseFloat(bidAmount).toLocaleString()}`;
    }
  };

  return (
    <>
      {loading && <Loading />}
      <div className="freelancerProjects">
        <div className="container">
          <div className="section projectDetails">
            {currentProject ? (
              <>
                <Link to={`/freelancer/${id}/projects`} className="backButton">
                  ← Back to Projects
                </Link>

                <div className="projectHeader">
                  <h2>{currentProject.title}</h2>
                  {getStatusBadge(currentProject.status)}
                </div>

                <div className="projectSection">
                  <h3>Project Details</h3>
                  <div className="projectDescription">
                    {currentProject.description}
                  </div>

                  <div className="projectInfo">
                    <div className="infoItem">
                      <span className="infoLabel">Budget</span>
                      <span className="infoValue">
                        {formatBudget(currentProject.budget)}
                      </span>
                    </div>

                    {currentProject.deadline && (
                      <div className="infoItem">
                        <span className="infoLabel">Deadline</span>
                        <span className="infoValue">
                          {moment(currentProject.deadline).format(
                            "MMM D, YYYY"
                          )}
                        </span>
                      </div>
                    )}

                    <div className="infoItem">
                      <span className="infoLabel">Posted By</span>
                      <span className="infoValue">
                        {currentProject.clientId?.name || "Client"}
                      </span>
                    </div>

                    <div className="infoItem">
                      <span className="infoLabel">Posted On</span>
                      <span className="infoValue">
                        {moment(currentProject.createdAt).format("MMM D, YYYY")}
                      </span>
                    </div>
                  </div>

                  {currentProject.skills &&
                    currentProject.skills.length > 0 && (
                      <div className="projectSkills">
                        <span className="infoLabel">Skills Required</span>
                        <div className="skillsList">
                          {currentProject.skills.map((skill, index) => (
                            <span key={index} className="skillTag">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {currentProject.status === "open" &&
                  !hasSubmittedProposal() && (
                    <div className="projectSection">
                      <div className="proposalForm">
                        <h3>Submit a Proposal</h3>
                        <form onSubmit={handleSubmitProposal}>
                          <div className="formGrid">
                            <div className="formGroup">
                              <label htmlFor="bidAmount">
                                Your Bid Amount (INR)
                              </label>
                              <div className="budgetInputGroup">
                                <span className="currencySymbol">₹</span>
                                <input
                                  type="number"
                                  id="bidAmount"
                                  name="bidAmount"
                                  value={proposalData.bidAmount.amount}
                                  onChange={handleChange}
                                  placeholder="Enter your bid amount"
                                  min="1"
                                  required
                                />
                              </div>
                            </div>
                            <div className="formGroup">
                              <label htmlFor="estimatedTime">
                                Estimated Completion Time
                              </label>
                              <input
                                type="text"
                                id="estimatedTime"
                                name="estimatedTime"
                                value={proposalData.estimatedTime}
                                onChange={handleChange}
                                placeholder="e.g., 5 days, 2 weeks"
                                required
                              />
                            </div>
                          </div>
                          <div className="formGroup">
                            <label htmlFor="proposal">Proposal Details</label>
                            <textarea
                              id="proposal"
                              name="proposal"
                              value={proposalData.proposal}
                              onChange={handleChange}
                              placeholder="Describe why you're the best fit for this project"
                              rows="5"
                              required
                            ></textarea>
                          </div>
                          <button type="submit" className="submitBtn">
                            Submit Proposal
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                {hasSubmittedProposal() && (
                  <div className="projectSection">
                    <h3>Your Proposal</h3>
                    {isAssignedToMe() ? (
                      <div className="alreadySubmitted">
                        <strong>Congratulations!</strong> You have been assigned
                        to this project. The client has accepted your proposal.
                      </div>
                    ) : (
                      <div className="proposalCard">
                        <div className="proposalHeader">
                          <div className="freelancerInfo">
                            <span className="freelancerName">
                              Your Proposal
                            </span>
                          </div>
                          <span
                            className={`proposalStatus ${
                              getMyProposal()?.status
                            }`}
                          >
                            {getMyProposal()?.status.charAt(0).toUpperCase() +
                              getMyProposal()?.status.slice(1)}
                          </span>
                        </div>
                        <div className="proposalDetails">
                          <p>{getMyProposal()?.proposal}</p>
                        </div>
                        <div className="proposalMeta">
                          <div className="metaItem">
                            <span className="metaLabel">Your Bid</span>
                            <span className="metaValue">
                              {formatBidAmount(getMyProposal()?.bidAmount)}
                            </span>
                          </div>
                          <div className="metaItem">
                            <span className="metaLabel">Estimated Time</span>
                            <span className="metaValue">
                              {getMyProposal()?.estimatedTime}
                            </span>
                          </div>
                          <div className="metaItem">
                            <span className="metaLabel">Submitted On</span>
                            <span className="metaValue">
                              {moment(getMyProposal()?.submittedAt).format(
                                "MMM D, YYYY"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="notFound">Project not found</div>
            )}
          </div>
          <FreelancerMenu active="projects" />
        </div>
      </div>
    </>
  );
}
