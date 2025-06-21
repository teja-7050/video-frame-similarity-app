const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const apiRoutes = require("./routes/apiroutes");
const path = require("path");
require("dotenv").config();

const app = express();
app.use("/frames", express.static(path.join(__dirname, "frames")));

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.static("public"));

// Mount your upload-video route
app.use("/api", apiRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Express server running on http://localhost:${PORT}`)
);
