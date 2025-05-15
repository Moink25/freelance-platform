import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Nav from "./components/Nav";
import Home from "./components/Home";
import Login from "./components/Login";
import PageNotFound from "./components/PageNotFound";
import Signup from "./components/Signup";
import Chat from "./components/Chat";
import Profile from "./components/Profile";

import FreelancerDashboard from "./components/FreelancerComponents/FreelancerDashboard";
import FreelancerServices from "./components/FreelancerComponents/FreelancerServices";
import FreelancerCreateService from "./components/FreelancerComponents/FreelancerCreateService";
import FreelancerManageServices from "./components/FreelancerComponents/FreelancerManageServices";
import FreelancerUpdateService from "./components/FreelancerComponents/FreelancerUpdateService";
import FreelancerWallet from "./components/FreelancerComponents/FreelancerWallet";
import FreelancerOrders from "./components/FreelancerComponents/FreelancerOrders";
import FreelancerOrderDetails from "./components/FreelancerComponents/FreelancerOrderDetails";
import FreelancerContracts from "./components/FreelancerComponents/FreelancerContracts";
import FreelancerProjects from "./components/FreelancerComponents/FreelancerProjects";
import FreelancerProjectDetails from "./components/FreelancerComponents/FreelancerProjectDetails";
import ServiceDetails from "./components/ServiceDetails";

import ClientDashboard from "./components/ClientComponents/ClientDashboard";
import ClientFreelancers from "./components/ClientComponents/ClientFreelancers";
import ClientOrders from "./components/ClientComponents/ClientOrders";
import ClientWallet from "./components/ClientComponents/ClientWallet";
import ClientProjects from "./components/ClientComponents/ClientProjects";
import ClientCreateProject from "./components/ClientComponents/ClientCreateProject";
import ClientProjectDetails from "./components/ClientComponents/ClientProjectDetails";
import ContractApiTest from "./components/ClientComponents/ContractApiTest";

function App() {
  console.log("App component mounting with routes for FreelancerOrderDetails");
  return (
    <div className="App">
      <Router>
        <Nav />
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/contract-test" element={<ContractApiTest />} />

          {/* Freelancer Routes */}
          <Route path="/dashboard/freelancer/:id">
            <Route index element={<FreelancerDashboard />} />
            <Route path="/dashboard/freelancer/:id/services">
              <Route index element={<FreelancerServices />} />
              <Route
                path="/dashboard/freelancer/:id/services/create"
                element={<FreelancerCreateService />}
              />
              <Route
                path="/dashboard/freelancer/:id/services/manage"
                element={<FreelancerManageServices />}
              />
              <Route
                path="/dashboard/freelancer/:id/services/update/:serviceId"
                element={<FreelancerUpdateService />}
              />
              <Route
                path="/dashboard/freelancer/:id/services/show/:serviceId"
                element={<ServiceDetails type="1" />}
              />
              <Route
                path="/dashboard/freelancer/:id/services/order/:orderId"
                element={<FreelancerOrderDetails />}
              />
            </Route>
            <Route
              path="/dashboard/freelancer/:id/orders"
              element={<FreelancerOrders />}
            />
            <Route
              path="/dashboard/freelancer/:id/contracts"
              element={<FreelancerContracts />}
            />
            <Route
              path="/dashboard/freelancer/:id/chat"
              element={<Chat type="freelancer" />}
            />
            <Route
              path="/dashboard/freelancer/:id/wallet"
              element={<FreelancerWallet />}
            />
            <Route
              path="/dashboard/freelancer/:id/profile"
              element={<Profile type="1" />}
            />
          </Route>

          {/* Freelancer Project Routes */}
          <Route
            path="/freelancer/:id/projects"
            element={<FreelancerProjects />}
          />
          <Route
            path="/freelancer/:id/project/:projectId"
            element={<FreelancerProjectDetails />}
          />

          {/* Client Routes */}
          <Route path="/dashboard/client/:id">
            <Route index element={<ClientDashboard />} />
            <Route
              path="/dashboard/client/:id/freelancers"
              element={<ClientFreelancers />}
            />
            <Route
              path="/dashboard/client/:id/services/show/:serviceId"
              element={<ServiceDetails type="2" />}
            />
            <Route
              path="/dashboard/client/:id/orders"
              element={<ClientOrders />}
            />
            <Route
              path="/dashboard/client/:id/order/show/:serviceId"
              element={<ServiceDetails type="3" />}
            />
            <Route
              path="/dashboard/client/:id/chat"
              element={<Chat type="client" />}
            />
            <Route
              path="/dashboard/client/:id/wallet"
              element={<ClientWallet />}
            />
            <Route
              path="/dashboard/client/:id/profile"
              element={<Profile type="2" />}
            />
            <Route
              path="/dashboard/client/:id/contract-test"
              element={<ContractApiTest />}
            />
          </Route>

          {/* Client Project Routes */}
          <Route path="/client/:id/projects" element={<ClientProjects />} />
          <Route
            path="/client/:id/create-project"
            element={<ClientCreateProject />}
          />
          <Route
            path="/client/:id/project/:projectId"
            element={<ClientProjectDetails />}
          />
          <Route
            path="/client/:id/services/show/:serviceId"
            element={<ServiceDetails type="2" />}
          />
          <Route
            path="/client/:id/freelancers"
            element={<ClientFreelancers />}
          />

          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
