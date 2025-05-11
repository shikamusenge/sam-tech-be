// File: routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");

if(process.env.NODE_ENV !== 'production'){
  const dotenv = require("dotenv");
  dotenv.config();
  }
const uri = process.env.MONGO_DB_URI; // Update if needed
const client = new MongoClient(uri);

// === LOGIN ROUTE ===
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    await client.connect();
    const db = client.db("samtechdb");
    const usersCollection = db.collection("admin");

    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    await client.close();
  }
});

// === SIGNUP ROUTE ===
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    await client.connect();
    const db = client.db("samtechdb");
    const usersCollection = db.collection("admin");

    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await usersCollection.insertOne({
      username,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    await client.close();
  }
});

module.exports = router;


router.post("/change-password", async (req, res) => {
    const { username, newPassword } = req.body;
  
    try {
      await client.connect();
      const db = client.db("samtechdb");
      const usersCollection = db.collection("admin");
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      const result = await usersCollection.updateOne(
        { username },
        { $set: { password: hashedPassword } }
      );
  
      if (result.modifiedCount === 1) {
        res.status(200).json({ message: "Password updated successfully" });
      } else {
        res.status(400).json({ message: "Failed to update password" });
      }
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Server error" });
    } finally {
      await client.close();
    }
  });
  