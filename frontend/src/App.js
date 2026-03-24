import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import API from "./api";
import "bootstrap/dist/css/bootstrap.min.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null); 
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isLoginView, setIsLoginView] = useState(false); 
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  
  const [allUsers, setAllUsers] = useState([]); 
  const [receiverId, setReceiverId] = useState("");
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const socket = useRef();

  useEffect(() => {
    if (token) {
      socket.current = io(API_URL, { auth: { token } });
      
      socket.current.on("new_notification", (data) => {
        setNotifications((prev) => [data, ...prev]);
        
        toast.info(`🔔 New from ${data.fromName}: ${data.message}`, {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
      });

      const fetchHistory = async () => {
        try {
          const res = await API.get(`/api/auth/notifications/${user?.id || user?._id}`);
          if(res.data.success) setNotifications(res.data.data);
        } catch (err) {
          console.log("History fetch error");
        }
      };

      const fetchUsers = async () => {
        try {
          const res = await API.get("/api/auth/list"); 
          setAllUsers(res.data);
        } catch (err) {
          console.error("Failed to Load Users", err);
        }
      };

      fetchHistory();
      fetchUsers();

      return () => socket.current.disconnect();
    }
  }, [token, user]);

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      alert("Email and Password are required!");
      return false;
    }
    if (!isLoginView && !formData.name) {
      alert("Name is Required!");
      return false;
    }
    return true;
  };

  const handleAuth = async (type) => {
    if (!validateForm()) return;
    try {
      const res = await API.post(`/api/auth/${type}`, formData);
      if (type === "login") {
        localStorage.setItem("token", res.data.accessToken);
        localStorage.setItem("user", JSON.stringify(res.data.user)); 
        setToken(res.data.accessToken);
        setUser(res.data.user);
        toast.success("Login Successful!");
      } else {
        toast.success("Register Successfully!");
        setIsLoginView(true);  
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something Went Wrong");
    }
  };

  const sendNotif = () => {
    if (!receiverId || !message) return toast.warn("Select Name and type Message!");
    if (socket.current) {
      const receiver = allUsers.find(u => u._id === receiverId);
      const receiverName = receiver ? receiver.name : "User";

      socket.current.emit("send_notification", { receiverId, message });
      setMessage("");
      toast.success(`${message}`, {
        position: "bottom-right",
        autoClose: 3000,
        theme: "colored",
      });

      setMessage("");
    }
  };

  if (!token) {
    return (
        <div className="container mt-5">
          <ToastContainer /> 
          <div className="row justify-content-center">
            <div className="col-md-5">
              <div className="card p-4 shadow-lg border-0">
                <h3 className="text-center mb-4">{isLoginView ? "Login to Account" : "Create New Account"}</h3>
                {!isLoginView && (
                  <div className="mb-3">
                    <label>Full Name</label>
                    <input className="form-control" placeholder="Enter Your Name" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                )}
                <div className="mb-3">
                  <label>Email Address</label>
                  <input className="form-control" placeholder="email@gmail.com" onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label>Password</label>
                  <input className="form-control" type="password" placeholder="Enter the Password" onChange={(e) => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="d-grid gap-2">
                  <button className="btn btn-primary" onClick={() => handleAuth(isLoginView ? "login" : "register")}>
                    {isLoginView ? "Login Now" : "Register"}
                  </button>
                </div>
                <p className="mt-3 text-center">
                  <button className="btn btn-link p-0" onClick={() => setIsLoginView(!isLoginView)}>
                    {isLoginView ? "Register Here" : "Login Here"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
  }

  return (
    <div className="container mt-5">
      <ToastContainer position="bottom-right" />
      
      <div className="card shadow p-4 border-0">
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <h4>Welcome, {user?.name || "User"}</h4>
          <button className="btn btn-danger btn-sm" onClick={() => { localStorage.clear(); window.location.reload(); }}>Logout</button>
        </div>
        
        <div className="row">
          <div className="col-md-6 border-end">
            <h5>Send Notification ⚡</h5>
            <label className="small text-muted">Select Receiver Name</label>
            <select className="form-select mb-2" value={receiverId} onChange={(e) => setReceiverId(e.target.value)}>
              <option value="">-- Choose User --</option>
              {allUsers.map(u => (
                u._id !== (user?.id || user?._id) && <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
            <textarea className="form-control mb-2" placeholder="Write message..." value={message} onChange={(e) => setMessage(e.target.value)} />
            <button className="btn btn-primary w-100" onClick={sendNotif}>Send Now</button>
          </div>

          <div className="col-md-6 ps-4">
            <h5>Recent Alerts</h5>
            <div className="list-group overflow-auto" style={{maxHeight: '300px'}}>
              {notifications.length === 0 && <p className="text-muted text-center py-3">No notifications yet.</p>}
              {notifications.map((n, i) => (
                <div key={i} className="list-group-item mb-2 shadow-sm rounded border-start border-primary border-4">
                  <small className="text-primary font-weight-bold">From: {n.fromName || n.sender?.name}</small>
                  <p className="mb-0">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;