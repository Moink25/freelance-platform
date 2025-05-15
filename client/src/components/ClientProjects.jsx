import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { tokenExists } from "../Redux/UserSlice";
import {
  getClientProjects,
  clearMessage,
  clearError,
} from "../Redux/ProjectSlice";
import { toast } from "react-toastify";
import ClientMenu from "./ClientComponents/ClientMenu";
import Loading from "./Loading";
import moment from "moment";

export default function ClientProjects() {
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((state) => state.user);
  const { clientProjects, error, message } = useSelector(
    (state) => state.project
  );
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    // Validate user is logged in and has correct role
    tokenExists(token, navigate, dispatch).then((data) => {
      if (data === false || userInfo._id !== id || userInfo.role !== "client") {
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
    dispatch(getClientProjects())
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

  const getStatusClass = (status) => {
    switch (status) {
      case "open":
        return "green";
      case "assigned":
        return "blue";
      case "completed":
        return "purple";
      case "cancelled":
        return "red";
      default:
        return "";
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
      <div className="clientServices">
        <div className="container">
          <div className="section">
            <div className="servicesSections">
              <div className="servicesHeader">
                <h3>My Projects</h3>
                <Link
                  to={`/client/${id}/create-project`}
                  className="createButton"
                >
                  Create New Project
                </Link>
              </div>

              {clientProjects && clientProjects.length > 0 ? (
                <div className="servicesCards">
                  {clientProjects.map((project) => (
                    <div className="serviceCard" key={project._id}>
                      <div className="serviceCardHeader">
                        <h4>{project.title}</h4>
                        <span
                          className={`status ${getStatusClass(project.status)}`}
                        >
                          {project.status.charAt(0).toUpperCase() +
                            project.status.slice(1)}
                        </span>
                      </div>
                      <div className="serviceCardBody">
                        <p>
                          {project.description.length > 100
                            ? project.description.substring(0, 100) + "..."
                            : project.description}
                        </p>
                        <div className="projectDetails">
                          <span>
                            <strong>Budget:</strong>{" "}
                            {formatBudget(project.budget)}
                          </span>
                          {project.deadline && (
                            <span>
                              <strong>Deadline:</strong>{" "}
                              {moment(project.deadline).format("MMM D, YYYY")}
                            </span>
                          )}
                          <span>
                            <strong>Proposals:</strong>{" "}
                            {project.proposals ? project.proposals.length : 0}
                          </span>
                        </div>
                      </div>
                      <div className="serviceCardFooter">
                        <Link
                          to={`/client/${id}/project/${project._id}`}
                          className="viewButton"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="noServices">
                  <p>You haven't created any projects yet.</p>
                  <Link
                    to={`/client/${id}/create-project`}
                    className="createButton"
                  >
                    Create Your First Project
                  </Link>
                </div>
              )}
            </div>
          </div>
          <ClientMenu active="projects" />
        </div>
      </div>
    </>
  );
}
