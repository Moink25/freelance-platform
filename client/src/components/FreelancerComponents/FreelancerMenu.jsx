import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  AiOutlineDashboard,
  AiOutlineUser,
  AiOutlineLogout,
} from "react-icons/ai";
import { BsCodeSquare, BsFileEarmarkText } from "react-icons/bs";
import { FiShoppingCart } from "react-icons/fi";
import { MdOutlineAttachMoney } from "react-icons/md";
import { BiChat } from "react-icons/bi";
import { GoProject } from "react-icons/go";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../Redux/UserSlice";

export default function FreelancerMenu({ active }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success("Logout !");
    navigate("/");
  };

  return (
    <div className="menu">
      <ul>
        <Link to={`/dashboard/freelancer/${id}`}>
          <li
            className={
              active === "dashboard" || active === "home" ? "active" : ""
            }
          >
            <AiOutlineDashboard className="navIcons" />
            <span>Dashboard</span>
          </li>
        </Link>
        <Link to={`/dashboard/freelancer/${id}/services`}>
          <li className={active === "services" ? "active" : ""}>
            <BsCodeSquare className="navIcons" />
            <span>Services</span>
          </li>
        </Link>
        <Link to={`/freelancer/${id}/projects`}>
          <li className={active === "projects" ? "active" : ""}>
            <GoProject className="navIcons" />
            <span>Projects</span>
          </li>
        </Link>
        <Link to={`/dashboard/freelancer/${id}/orders`}>
          <li className={active === "orders" ? "active" : ""}>
            <FiShoppingCart className="navIcons" />
            <span>Orders</span>
          </li>
        </Link>
        <Link to={`/dashboard/freelancer/${id}/contracts`}>
          <li className={active === "contracts" ? "active" : ""}>
            <BsFileEarmarkText className="navIcons" />
            <span>Contracts</span>
          </li>
        </Link>
        <Link to={`/dashboard/freelancer/${id}/chat`}>
          <li className={active === "chat" ? "active" : ""}>
            <BiChat className="navIcons" />
            <span>Messages</span>
          </li>
        </Link>
        <Link to={`/dashboard/freelancer/${id}/wallet`}>
          <li className={active === "wallet" ? "active" : ""}>
            <MdOutlineAttachMoney className="navIcons" />
            <span>Wallet</span>
          </li>
        </Link>
        <Link to={`/dashboard/freelancer/${id}/profile`}>
          <li className={active === "profile" ? "active" : ""}>
            <AiOutlineUser className="navIcons" />
            <span>Profile</span>
          </li>
        </Link>
        <li onClick={handleLogout} className="a">
          <AiOutlineLogout className="navIcons" />
          <span>Logout</span>
        </li>
      </ul>
    </div>
  );
}
