import FreelancerMenu from "./FreelancerMenu";
import { HashLink } from "react-router-hash-link";
import noImage from "../../assets/Images/no-image.png";
import Slider from "../Slider";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { tokenExists } from "../../Redux/UserSlice";
import { toast } from "react-toastify";
import Loading from "../Loading";
import { HiOutlineXCircle } from "react-icons/hi";
import { AiOutlineCheckCircle, AiOutlinePlayCircle } from "react-icons/ai";
import { MdOutlineFilterAltOff } from "react-icons/md";
import { getFreelancerOrders } from "../../Redux/FreelancerSlice";

export default function FreelancerOrders() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [orders, setOrders] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.user);
  const { data } = useSelector((state) => state.freelancer);

  useEffect(() => {
    tokenExists(token, navigate, dispatch).then(
      (data) =>
        (data == false ||
          JSON.parse(localStorage.getItem("userInfo")).role !== "freelancer" ||
          JSON.parse(localStorage.getItem("userInfo"))._id !== id) &&
        navigate("/login")
    );
  }, []);

  useEffect(() => {
    fetchFreelancerOrders();
  }, []);

  useEffect(() => {
    if (data?.freelancerOrders) {
      setOrders(data.freelancerOrders);
      setLoading(false);
    }
  }, [data]);

  const fetchFreelancerOrders = () => {
    setLoading(true);
    dispatch(getFreelancerOrders())
      .unwrap()
      .then((data) => {
        if (data.status !== 200) {
          toast.error(data.msg);
        }
      })
      .catch((error) => {
        toast.error("Failed to fetch orders: " + error);
      });
  };

  const filteredOrders = () => {
    if (filter === "All") {
      return orders;
    }
    return orders.filter((order) => order.status === filter);
  };

  return (
    <>
      {loading && <Loading />}
      <div className="FreelancerOrders ClientOrders">
        <div className="container">
          <div className="section">
            <div className="orders-header">Orders for My Services</div>
            <div className="filterOrders">
              <div
                className={filter == "All" ? "filter all active" : "filter all"}
                onClick={() => setFilter("All")}
              >
                <MdOutlineFilterAltOff /> All
              </div>
              <div
                className={
                  filter == "OnGoing"
                    ? "filter ongoing active"
                    : "filter ongoing"
                }
                onClick={() => setFilter("OnGoing")}
              >
                <AiOutlinePlayCircle /> Ongoing
              </div>
              <div
                className={
                  filter == "Completed"
                    ? "filter completed active"
                    : "filter completed"
                }
                onClick={() => setFilter("Completed")}
              >
                <AiOutlineCheckCircle /> Completed
              </div>
              <div
                className={
                  filter == "Cancelled"
                    ? "filter cancelled active"
                    : "filter cancelled"
                }
                onClick={() => setFilter("Cancelled")}
              >
                <HiOutlineXCircle /> Cancelled
              </div>
            </div>

            <div className="services">
              {filteredOrders().length > 0 ? (
                filteredOrders().map((order) => (
                  <div className="service" key={order._id}>
                    <div className="imageSlider">
                      {order.serviceInfo.images.length > 0 ? (
                        <Slider
                          images={order.serviceInfo.images.map(
                            (img) => `http://localhost:3001/${img}`
                          )}
                        />
                      ) : (
                        <img src={noImage} alt="No Image" />
                      )}
                    </div>
                    <div className="textInfo">
                      <div className="serviceTitle">
                        {order.serviceInfo.title}
                      </div>
                      <HashLink
                        to={`/dashboard/freelancer/${id}/services/order/${order._id}`}
                      >
                        <button>View Details</button>
                      </HashLink>
                    </div>
                    <div className="serviceDescription">
                      Ordered by: {order.clientInfo.username}
                    </div>
                    <div className="servicePrice">
                      Price: {order.serviceInfo.price} ₹
                    </div>
                    <div className="paymentStatus">
                      Payment:{" "}
                      {order.paymentStatus === "completed" ? (
                        <span className="completed">Paid</span>
                      ) : (
                        <span className="ongoing">Pending</span>
                      )}
                    </div>
                    <hr />
                    <div className="serviceState">
                      State:{" "}
                      {order.status == "OnGoing" ? (
                        <span className="ongoing">OnGoing</span>
                      ) : order.status == "Cancelled" ? (
                        <span className="cancelled">Cancelled</span>
                      ) : (
                        <span className="completed">Completed</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="noServices">
                  No orders for your services yet
                </div>
              )}
            </div>
          </div>
          <FreelancerMenu active="orders" />
        </div>
      </div>
    </>
  );
}
