const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
const path = require("path");

// Ensure the uploads/videos folder exists
const uploadDir = path.join(__dirname, "../uploads/videos");
fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const finalName = uniqueSuffix + "-" + file.originalname;
    console.log("[Multer] Storing file as:", finalName);
    cb(null, finalName);
  },
});
const upload = multer({ storage });

// POST route: /api/upload-video
router.post("/upload-video", upload.single("video"), async (req, res) => {
  console.log("🚀 POST /api/upload-video triggered");

  if (!req.file) {
    console.error("❌ No file received");
    return res.status(400).json({ error: "No video file uploaded" });
  }

  const fastApiProcessVideoUrl = "http://localhost:8000/process_video"; // Renamed for clarity

  console.log("✅ Video saved at:", req.file.path);
  console.log("📦 File details:", {
    name: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });

  try {
    // Read the video into a buffer
    console.log("📥 Reading video file into buffer...");
    const videoBuffer = fs.readFileSync(req.file.path);
    console.log("✅ Video buffer size:", videoBuffer.length, "bytes");

    // Prepare form-data
    const formData = new FormData();
    formData.append("video_file", videoBuffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    console.log(
      "📡 Sending video processing request to FastAPI:",
      fastApiProcessVideoUrl
    );
    const response = await axios.post(fastApiProcessVideoUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log("✅ FastAPI process_video response:", response.data);

    // Delete uploaded video after processing
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log("🧹 Deleted temporary uploaded video:", req.file.path);
    }

    if (response.data.success) {
      return res.json({ success: true, frames: response.data.frames });
    } else {
      console.error(
        "❌ FastAPI process_video failed with:",
        response.data.message
      );
      return res.status(500).json({
        error: "FastAPI video processing failed",
        details: response.data.message,
      });
    }
  } catch (err) {
    console.error("❌ Error during video processing:", err.message);

    // Attempt cleanup
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log("🧹 Cleaned up failed video:", req.file.path);
    }

    // Log FastAPI error details if available
    if (err.response?.data) {
      console.error(
        "📩 FastAPI process_video error response:",
        err.response.data
      );
    }

    return res.status(500).json({
      error: "Node error communicating with FastAPI for video processing",
      message: err.message,
    });
  }
});

// NEW POST route: /api/search-vector
router.post("/search", async (req, res) => {
  console.log("🚀 POST /api/search-vector triggered");

  const { vector } = req.body; // Expecting the vector in the request body
  if (!vector) {
    console.error("❌ No vector received in request body");
    return res
      .status(400)
      .json({ error: "Vector is required in the request body." });
  }

  const fastApiSearchVectorUrl = "http://localhost:8000/search-vector"; // This is the FastAPI endpoint you want to hit

  console.log(
    "📡 Sending search vector request to FastAPI:",
    fastApiSearchVectorUrl
  );
  // console.log("🔍 Vector being sent:", vector); // Uncomment for debugging if needed

  try {
    const response = await axios.post(
      fastApiSearchVectorUrl,
      { vector },
      {
        headers: {
          "Content-Type": "application/json", // Important: sending JSON
        },
      }
    );

    console.log("✅ FastAPI search-vector response:", response.data);
    return res.json(response.data); // Forward FastAPI's response directly
  } catch (err) {
    console.error("❌ Error during search vector processing:", err.message);

    // Log FastAPI error details if available
    if (err.response?.data) {
      console.error(
        "📩 FastAPI search-vector error response:",
        err.response.data
      );
    }

    return res.status(500).json({
      error: "Node error communicating with FastAPI for vector search",
      message: err.message,
      fastApiDetails: err.response?.data || null, // Include FastAPI's response for debugging
    });
  }
});

module.exports = router;
