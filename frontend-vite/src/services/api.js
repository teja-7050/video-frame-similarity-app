// src/services/api.js

import axios from "axios";
const BASE_URL = "http://localhost:5000/api"; // Node backend that relays to FastAPI

// Upload Video
export const uploadVideo = async (videoFile) => {
  const formData = new FormData();
  formData.append("video", videoFile); // matches multer single("video")

  try {
    console.log("Uploading video...");
    const response = await axios.post(`${BASE_URL}/upload-video`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading video:", error);
    throw error;
  }
};

export const searchVector = async (vector) => {
  try {
    const response = await axios.post(`${BASE_URL}/search`, {
      vector: vector,
    });
    return response.data;
  } catch (error) {
    console.error("Error searching vector:", error);
    throw error;
  }
};
