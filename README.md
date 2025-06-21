This project is a full-stack web application that:

- Accepts video uploads.
- Extracts frames from the video at regular intervals.
- Computes feature vectors (color histograms) for each frame.
- Stores these vectors in Qdrant (a vector database).
- Allows users to perform similarity search using a selected frame's vector.
- Displays visually similar frames with their scores and vectors.

The app is built with:
- **Frontend**: React + Vite
- **Backend**: Node.js + Express (for upload and coordination)
- **ML API**: FastAPI (for frame processing, vector generation and similarity search)
- **Vector DB**: Qdrant (running in Docker)



## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/teja-7050/video-frame-similarity-app.git
cd video-frame-similarity-app

### 2. Ensure Docker is installed and running, then start Qdrant:

docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant

### 3. Set Up and Run FastAPI Backend
cd Backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
nodemon server.js

### 4.Start React Frontend
cd frontend-vite
npm install
npm run dev

### 5. Access the App
Frontend: http://localhost:5173

FastAPI Docs: http://localhost:8000/docs

Qdrant Dashboard: http://localhost:6333/dashboard

