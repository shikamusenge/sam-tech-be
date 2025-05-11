const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const productRoutes = require("./routes/products");
const eventRoutes = require("./routes/events");
const blogRoutes = require("./routes/blogs");
const careerRoutes = require("./routes/careers");
const bodyParser = require("body-parser");
const cartRoutes = require("./routes/cart");
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orderRoutes");
const messageRoutes = require("./routes/messages");
const userRoutes = require('./routes/users');
const orders = require('./orders');
const clientAuth = require('./ClientAuth/ClientAuth');

if(process.env.NODE_ENV !== 'production'){
const dotenv = require("dotenv");
dotenv.config();
}
const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URLSALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:5173';
// console.log({FRONTEND_URLSALLOWED_ORIGINS});
// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || FRONTEND_URLSALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS ${FRONTEND_URLSALLOWED_ORIGINS}`));
    }
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
app.use("/api/products", productRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/careers", careerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients/orders", orders);
app.use("/clients", clientAuth);

// Database connection
mongoose.connect(process.env.MONGO_DB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
  console.error("MongoDB connection error:", err.message,{URI:process.env.MONGO_DB_URI});
    process.exit(1);
  });