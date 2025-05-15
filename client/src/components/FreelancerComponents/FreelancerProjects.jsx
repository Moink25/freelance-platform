import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { tokenExists } from "../../Redux/UserSlice";
import {
  getAllProjects,
  getFreelancerProjects,
  clearMessage,
  clearError,
} from "../../Redux/ProjectSlice";
import { toast } from "react-toastify";
import FreelancerMenu from "./FreelancerMenu";
import Loading from "../Loading";
import moment from "moment";

export default function FreelancerProjects() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available");
  const { token } = useSelector((state) => state.user);
  const { allProjects, freelancerProjects, error, message } = useSelector(
    (state) => state.project
  );
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

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

    loadProjects();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
    if (message) {
      toast.success(message);
      dispatch(clearMessage());
    }
  }, [error, message]);

  const loadProjects = () => {
    setLoading(true);

    // Get all available projects
    dispatch(getAllProjects())
      .unwrap()
      .then(() => {
        // Get freelancer's projects (both assigned and proposed)
        dispatch(getFreelancerProjects())
          .unwrap()
          .then(() => {
            setTimeout(() => {
              setLoading(false);
            }, 500);
          })
          .catch((error) => {
            setLoading(false);
            toast.error(error);
          });
      })
      .catch((error) => {
        setLoading(false);
        toast.error(error);
      });
  };

  const getSkillsPreview = (skills) => {
    if (!skills || skills.length === 0) return null;

    return (
      <div className="skillsPreview">
        {skills.slice(0, 3).map((skill, index) => (
          <span key={index} className="skillTag">
            {skill}
          </span>
        ))}
        {skills.length > 3 && (
          <span className="moreSkills">+{skills.length - 3}</span>
        )}
      </div>
    );
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

  const renderProjects = () => {
    switch (activeTab) {
      case "available":
        return (
          <div className="projectList">
            {allProjects && allProjects.length > 0 ? (
              allProjects.map((project) => (
                <div className="projectCard" key={project._id}>
                  <div className="projectHeader">
                    <h4>{project.title}</h4>
                    <span className="budget">
                      {formatBudget(project.budget)}
                    </span>
                  </div>
                  <div className="projectBody">
                    <p>
                      {project.description.length > 150
                        ? project.description.substring(0, 150) + "..."
                        : project.description}
                    </p>
                    {getSkillsPreview(project.skills)}
                  </div>
                  <div className="projectFooter">
                    <span className="postedDate">
                      Posted {moment(project.createdAt).fromNow()}
                    </span>
                    <Link
                      to={`/freelancer/${id}/project/${project._id}`}
                      className="viewButton"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="noProjects">
                <p>No available projects found.</p>
              </div>
            )}
          </div>
        );

      case "myProjects":
        return (
          <div className="myProjectsTabs">
            <div className="subTabs">
              <button
                className={activeTab === "myProjects" ? "active" : ""}
                onClick={() => setActiveTab("myProjects")}
              >
                Assigned Projects (
                {freelancerProjects?.assignedProjects?.length || 0})
              </button>
              <button
                className={activeTab === "myProposals" ? "active" : ""}
                onClick={() => setActiveTab("myProposals")}
              >
                My Proposals (
                {freelancerProjects?.proposedProjects?.length || 0})
              </button>
            </div>

            {freelancerProjects?.assignedProjects &&
            freelancerProjects.assignedProjects.length > 0 ? (
              <div className="projectList">
                {freelancerProjects.assignedProjects.map((project) => (
                  <div className="projectCard assigned" key={project._id}>
                    <div className="projectHeader">
                      <h4>{project.title}</h4>
                      <span className="badge blue">In Progress</span>
                    </div>
                    <div className="projectBody">
                      <p>
                        {project.description.length > 150
                          ? project.description.substring(0, 150) + "..."
                          : project.description}
                      </p>
                      <div className="clientInfo">
                        <span>
                          <strong>Client:</strong> {project.clientId.name}
                        </span>
                        <span>
                          <strong>Budget:</strong>{" "}
                          {formatBudget(project.budget)}
                        </span>
                      </div>
                    </div>
                    <div className="projectFooter">
                      <span className="postedDate">
                        Assigned {moment(project.updatedAt).fromNow()}
                      </span>
                      <Link
                        to={`/freelancer/${id}/project/${project._id}`}
                        className="viewButton"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="noProjects">
                <p>You don't have any assigned projects yet.</p>
              </div>
            )}
          </div>
        );

      case "myProposals":
        return (
          <div className="myProjectsTabs">
            <div className="subTabs">
              <button
                className={activeTab === "myProjects" ? "active" : ""}
                onClick={() => setActiveTab("myProjects")}
              >
                Assigned Projects (
                {freelancerProjects?.assignedProjects?.length || 0})
              </button>
              <button
                className={activeTab === "myProposals" ? "active" : ""}
                onClick={() => setActiveTab("myProposals")}
              >
                My Proposals (
                {freelancerProjects?.proposedProjects?.length || 0})
              </button>
            </div>

            {freelancerProjects?.proposedProjects &&
            freelancerProjects.proposedProjects.length > 0 ? (
              <div className="projectList">
                {freelancerProjects.proposedProjects.map((project) => {
                  // Find the freelancer's proposal
                  const myProposal = project.proposals.find(
                    (p) => p.freelancerId._id === id
                  );

                  return (
                    <div className="projectCard proposal" key={project._id}>
                      <div className="projectHeader">
                        <h4>{project.title}</h4>
                        <span
                          className={`badge ${
                            myProposal.status === "pending" ? "yellow" : "red"
                          }`}
                        >
                          {myProposal.status === "pending"
                            ? "Pending"
                            : "Rejected"}
                        </span>
                      </div>
                      <div className="projectBody">
                        <p>
                          {project.description.length > 100
                            ? project.description.substring(0, 100) + "..."
                            : project.description}
                        </p>
                        <div className="proposalInfo">
                          <div className="proposalDetail">
                            <span>
                              <strong>Your Bid:</strong> ${myProposal.bidAmount}
                            </span>
                            <span>
                              <strong>Estimated Time:</strong>{" "}
                              {myProposal.estimatedTime}
                            </span>
                          </div>
                          <div className="clientInfo">
                            <span>
                              <strong>Client:</strong> {project.clientId.name}
                            </span>
                            <span>
                              <strong>Project Budget:</strong>{" "}
                              {formatBudget(project.budget)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="projectFooter">
                        <span className="postedDate">
                          Submitted {moment(myProposal.submittedAt).fromNow()}
                        </span>
                        <Link
                          to={`/freelancer/${id}/project/${project._id}`}
                          className="viewButton"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="noProjects">
                <p>You haven't submitted any proposals yet.</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {loading && <Loading />}
      <div className="freelancerProjects">
        <div className="container">
          <div className="section">
            <div className="projectsTabs">
              <button
                className={activeTab === "available" ? "active" : ""}
                onClick={() => setActiveTab("available")}
              >
                Available Projects
              </button>
              <button
                className={activeTab === "myProjects" ? "active" : ""}
                onClick={() => setActiveTab("myProjects")}
              >
                My Projects
              </button>
              <button
                className={activeTab === "myProposals" ? "active" : ""}
                onClick={() => setActiveTab("myProposals")}
              >
                My Proposals
              </button>
            </div>

            {renderProjects()}
          </div>
          <FreelancerMenu active="projects" />
        </div>
      </div>
    </>
  );
}
