import { useParams, Link } from "react-router-dom";
import {
  AiOutlineDashboard,
  AiOutlineUser,
  AiOutlineLogout,
} from "react-icons/ai";
import { RiFileUserLine } from "react-icons/ri";
import { FiShoppingCart } from "react-icons/fi";
import { MdOutlineAttachMoney } from "react-icons/md";
import { BiChat } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../Redux/UserSlice";

export default function ClientMenu({ active }) {
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
        <Link to={`/dashboard/client/${id}`}>
          <li className={active === "dashboard" ? "active" : ""}>
            <AiOutlineDashboard className="navIcons" />
            <span>Dashboard</span>
          </li>
        </Link>
        <Link to={`/dashboard/client/${id}/freelancers`}>
          <li className={active === "freelancers" ? "active" : ""}>
            <RiFileUserLine className="navIcons" />
            <span>Find Services</span>
          </li>
        </Link>
        <Link to={`/dashboard/client/${id}/orders`}>
          <li className={active === "orders" ? "active" : ""}>
            <FiShoppingCart className="navIcons" />
            <span>Orders</span>
          </li>
        </Link>
        <Link to={`/dashboard/client/${id}/chat`}>
          <li className={active === "chat" ? "active" : ""}>
            <BiChat className="navIcons" />
            <span>Messages</span>
          </li>
        </Link>
        <Link to={`/dashboard/client/${id}/wallet`}>
          <li className={active === "wallet" ? "active" : ""}>
            <MdOutlineAttachMoney className="navIcons" />
            <span>Wallet</span>
          </li>
        </Link>
        <Link to={`/dashboard/client/${id}/profile`}>
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
