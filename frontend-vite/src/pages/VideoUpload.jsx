
import React, { useState, useRef } from "react";
import { uploadVideo, searchVector } from "../services/api"; // Import searchVector
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "./VideoUpload.css"; // Import CSS

const VideoUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setUploadError("");
    } else {
      setUploadError("Please upload a valid video file.");
      setSelectedFile(null);
      setVideoPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a video.");
      return;
    }

    setLoading(true);
    setUploadError("");
    setFrames([]);

    try {
      const data = await uploadVideo(selectedFile);
      if (data.success && data.frames) {
        setFrames(data.frames);
      } else {
        setUploadError("Failed to process video.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = async (frameVector) => {
    try {
      // Trigger the POST API call with the selected image's vector
      const response = await searchVector(frameVector);
      console.log("Search vector API response:", response);

      // Redirect to Results.jsx (you can pass data via state if needed)
      navigate("/results", {
        state: { searchResults: response.results, selectedVector: frameVector },
      });
    } catch (error) {
      console.error("Error during image click and search:", error);
      // Handle error, e.g., show an alert to the user
      setUploadError("Failed to perform search with the selected image.");
    }
  };

  return (
    <div className="upload-container">
      <div className="card">
        <h2>Upload Video</h2>
        {/* Changed input to a more user-friendly button for file selection */}
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: "none" }} // Hide the default file input
        />
        <button
          onClick={() => fileInputRef.current.click()}
          className="choose-file-button"
        >
          Choose File
        </button>
        {selectedFile && <span className="file-name">{selectedFile.name}</span>}
        {videoPreview && <video src={videoPreview} controls width="400" />}
        {uploadError && <p className="error-message">{uploadError}</p>}
        <button
          onClick={handleUpload}
          disabled={loading || !selectedFile}
          className="upload-button"
        >
          {loading ? "Processing..." : "Upload"}
        </button>
      </div>

      <div className="grid-container">
        {frames.map((frame, index) => (
          <div className="frame-card" key={index}>
            <h4>Frame {index + 1}</h4>
            {/* Make the image a button */}
            <button
              className="frame-image-button"
              onClick={() => handleImageClick(frame.vector)}
            >
              <img src={frame.path} alt={`frame-${index}`} />
            </button>
            <div className="vector-scroll">
              {frame.vector.map((val, i) => (
                <span key={i}>{val.toFixed(2)} </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoUpload;
