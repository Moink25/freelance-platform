import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { tokenExists } from "../../Redux/UserSlice";
import {
  createProject,
  clearMessage,
  clearError,
} from "../../Redux/ProjectSlice";
import { toast } from "react-toastify";
import ClientMenu from "./ClientMenu";
import Loading from "../Loading";
import axios from "axios";

export default function ClientCreateProject() {
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: {
      amount: "",
      currency: "INR",
    },
    deadline: "",
    skills: [],
  });
  const [skill, setSkill] = useState("");
  const { token } = useSelector((state) => state.user);
  const { error, message } = useSelector((state) => state.project);
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
      fetchWalletBalance();
    });
  }, []);

  // Fetch the client's wallet balance
  const fetchWalletBalance = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/wallet/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWalletBalance(res.data.balance);
      setLoading(false);
    } catch (error) {
      toast.error("Error fetching wallet balance");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
    if (message) {
      toast.success(message);
      dispatch(clearMessage());
      // Navigate back to projects page after successful creation
      navigate(`/client/${id}/projects`);
    }
  }, [error, message]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "budget") {
      setFormData({
        ...formData,
        budget: {
          ...formData.budget,
          amount: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Check if budget exceeds wallet balance
  const isBudgetValid = () => {
    const budgetAmount = parseFloat(formData.budget.amount);
    return budgetAmount > 0 && budgetAmount <= walletBalance;
  };

  const addSkill = () => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill.trim()],
      });
      setSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic form validation
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.budget.amount
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if budget amount is valid
    const budgetAmount = parseFloat(formData.budget.amount);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }

    // Check if budget exceeds wallet balance
    if (budgetAmount > walletBalance) {
      toast.error(
        "Budget amount exceeds your wallet balance. Please add funds to your wallet or lower your budget."
      );
      return;
    }

    setLoading(true);

    // Convert budget amount to number
    const projectData = {
      ...formData,
      budget: {
        ...formData.budget,
        amount: parseFloat(formData.budget.amount),
      },
    };

    dispatch(createProject(projectData))
      .unwrap()
      .catch(() => {
        setLoading(false);
      });
  };

  return (
    <>
      {loading && <Loading />}
      <div className="clientServices">
        <div className="container">
          <div className="section">
            <div className="createService">
              <h3>Create New Project</h3>
              <p>Post a project to find skilled freelancers</p>

              <form onSubmit={handleSubmit}>
                <div className="formGroup">
                  <label htmlFor="title">Project Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter a clear title for your project"
                    required
                  />
                </div>

                <div className="formGroup">
                  <label htmlFor="description">Project Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your project, requirements, and expectations in detail"
                    rows="6"
                    required
                  ></textarea>
                </div>

                <div className="formGroup">
                  <label htmlFor="budget">
                    Budget (INR) *{" "}
                    <span className="walletInfo">
                      Your wallet balance: ₹{walletBalance}
                    </span>
                  </label>
                  <div className="budgetInputGroup">
                    <span className="currencySymbol">₹</span>
                    <input
                      type="number"
                      id="budget"
                      name="budget"
                      value={formData.budget.amount}
                      onChange={handleChange}
                      placeholder="Enter your budget"
                      min="1"
                      max={walletBalance}
                      step="any"
                      required
                    />
                  </div>
                  {parseFloat(formData.budget.amount) > walletBalance && (
                    <div className="error-message">
                      Budget exceeds wallet balance!
                    </div>
                  )}
                </div>

                <div className="formGroup">
                  <label htmlFor="deadline">Deadline (Optional)</label>
                  <input
                    type="date"
                    id="deadline"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="formGroup">
                  <label htmlFor="skills">Skills Required (Optional)</label>
                  <div className="skillsInputContainer">
                    <input
                      type="text"
                      id="skills"
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Add skills and press Enter"
                    />
                    <button
                      type="button"
                      className="addSkillBtn"
                      onClick={addSkill}
                    >
                      Add
                    </button>
                  </div>

                  {formData.skills.length > 0 && (
                    <div className="skillTags">
                      {formData.skills.map((s, index) => (
                        <div key={index} className="skillTag">
                          {s}
                          <button
                            type="button"
                            onClick={() => removeSkill(s)}
                            className="removeSkillBtn"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="formActions">
                  <button
                    type="button"
                    className="cancelBtn"
                    onClick={() => navigate(`/client/${id}/projects`)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submitBtn">
                    Post Project
                  </button>
                </div>
              </form>
            </div>
          </div>
          <ClientMenu active="projects" />
        </div>
      </div>
    </>
  );
}
