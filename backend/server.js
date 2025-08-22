import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import askRoute from "./routes/ask.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Custom CORS settings
const corsOptions = {
  origin: ["http://localhost:5173", "https://readingassist.netlify.app/"],
  methods: ["GET", "POST", "OPTIONS"], // allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // allowed headers
  credentials: true // if you need cookies/auth headers
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api", askRoute);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
