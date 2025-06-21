# from fastapi import FastAPI, UploadFile, File
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# import cv2
# import os
# import uuid
# import numpy as np
# from qdrant_client import QdrantClient, models as qmodels

# app = FastAPI()

# # CORS for frontend access
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", "http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Qdrant client setup (Docker local)
# qdrant = QdrantClient(host="localhost", port=6333)
# COLLECTION_NAME = "video_frames"
# VECTOR_DIM = 24  # bins=8 x 3 channels = 24 features

# # Create collection if not exists
# # Recreate collection if exists (to match updated VECTOR_DIM)
# if qdrant.collection_exists(COLLECTION_NAME):
#     qdrant.delete_collection(collection_name=COLLECTION_NAME)

# qdrant.create_collection(
#     collection_name=COLLECTION_NAME,
#     vectors_config=qmodels.VectorParams(
#         size=VECTOR_DIM,
#         distance=qmodels.Distance.COSINE
#     )
# )


# # Feature vector: Color histogram extractor
# def extract_color_histogram(image, bins=8):
#     chans = cv2.split(image)
#     hist = []
#     for chan in chans:
#         h = cv2.calcHist([chan], [0], None, [bins], [0, 256])
#         hist.extend(h.flatten())
#     hist = np.array(hist).astype("float")
#     norm = np.linalg.norm(hist)
#     if norm > 0:
#         hist /= norm
#     return hist

# # Video processing route
# @app.post("/process_video")
# async def process_video(video_file: UploadFile = File(...)):
#     temp_path = f"temp_{video_file.filename}"
#     with open(temp_path, "wb") as f:
#         f.write(await video_file.read())

#     cap = cv2.VideoCapture(temp_path)
#     if not cap.isOpened():
#         return JSONResponse(status_code=500, content={"success": False, "message": "Could not open video"})

#     os.makedirs(os.path.join("frontend-vite", "public", "frames"), exist_ok=True)
#     count = 0
#     frames = []

#     fps = cap.get(cv2.CAP_PROP_FPS)
#     frame_interval = int(fps) if fps > 0 else 1
#     frame_number = 0

#     while True:
#         ret, frame = cap.read()
#         if not ret:
#             break

#         if frame_number % frame_interval == 0:
#             frame_filename = f"frame_{count}.jpg"
#             frame_path = os.path.join("frontend-vite", "public", "frames", frame_filename)
#             cv2.imwrite(frame_path, frame)
#             frames.append(f"/frames/{frame_filename}")

#             # Feature extraction
#             vector = extract_color_histogram(frame)

#             if len(vector) != VECTOR_DIM:
#                 return JSONResponse(
#                     status_code=500,
#                     content={"success": False, "message": f"Vector dimension mismatch: expected {VECTOR_DIM}, got {len(vector)}"}
#                 )

#             # Insert into Qdrant
#             qdrant.upsert(
#                 collection_name=COLLECTION_NAME,
#                 points=[
#                     qmodels.PointStruct(
#                         id=str(uuid.uuid4()),
#                         vector=vector.tolist(),
#                         payload={"frame_path": frame_filename}
#                     )
#                 ]
#             )
#             count += 1

#         frame_number += 1

#     cap.release()
#     os.remove(temp_path)

#     return {"success": True, "frames": frames}
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel # Import BaseModel
import cv2
import os
import uuid
import numpy as np
from qdrant_client import QdrantClient, models as qmodels

app = FastAPI()

# CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Qdrant client setup (Docker local)
qdrant = QdrantClient(host="localhost", port=6333)
COLLECTION_NAME = "video_frames"
VECTOR_DIM = 24  # bins=8 x 3 channels = 24 features

# Recreate collection to match current vector dimension
# This is useful for development to ensure a clean state
if qdrant.collection_exists(COLLECTION_NAME):
    qdrant.delete_collection(collection_name=COLLECTION_NAME)
    print(f"Collection '{COLLECTION_NAME}' deleted.")

qdrant.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=qmodels.VectorParams(
        size=VECTOR_DIM,
        distance=qmodels.Distance.COSINE
    )
)
print(f"Collection '{COLLECTION_NAME}' created with dimension {VECTOR_DIM} and COSINE distance.")


# Feature vector extractor using color histograms
def extract_color_histogram(image, bins=8):
    chans = cv2.split(image)
    hist = []
    for chan in chans:
        h = cv2.calcHist([chan], [0], None, [bins], [0, 256])
        hist.extend(h.flatten())
    hist = np.array(hist).astype("float")
    norm = np.linalg.norm(hist)
    if norm > 0:
        hist /= norm
    return hist.tolist() # Return as list for JSON serialization

# Pydantic model for incoming vector data
class SearchVectorRequest(BaseModel):
    vector: list[float]

# Video upload and processing endpoint
@app.post("/process_video")
async def process_video(video_file: UploadFile = File(...)):
    print(f"Received video file: {video_file.filename}")
    temp_path = f"temp_{uuid.uuid4()}_{video_file.filename}" # Use uuid to prevent conflicts
    try:
        with open(temp_path, "wb") as f:
            f.write(await video_file.read())
        print(f"Video saved temporarily at: {temp_path}")

        cap = cv2.VideoCapture(temp_path)
        if not cap.isOpened():
            print(f"ERROR: Could not open video file: {temp_path}")
            return JSONResponse(status_code=500, content={"success": False, "message": "Could not open video"})

        # Define the directory to save frames, relative to the FastAPI app's current working directory
        # This assumes your frontend is expecting frames from '/frames/' public path
        frames_output_dir = "../frontend-vite/public/frames"
        os.makedirs(frames_output_dir, exist_ok=True)
        print(f"Ensured frames output directory exists: {frames_output_dir}")

        count = 0
        frame_results = []

        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = 10 # Process one frame per second
        if frame_interval == 0: # Avoid division by zero if FPS is reported as 0
            frame_interval = 1
        frame_number = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_number % frame_interval == 0: # Process frames at intervals
                frame_id = str(uuid.uuid4()) # Unique ID for each frame
                frame_filename = f"frame_{count}_{frame_id}.jpg"
                frame_save_path = os.path.join(frames_output_dir, frame_filename)
                
                # Check if frame is valid before saving
                if frame is None or frame.size == 0:
                    print(f"WARNING: Empty frame at frame_number {frame_number}. Skipping.")
                    frame_number += 1
                    continue

                cv2.imwrite(frame_save_path, frame)
                relative_path = f"/frames/{frame_filename}" # Path accessible from frontend

                # Extract vector
                vector = extract_color_histogram(frame)

                if len(vector) != VECTOR_DIM:
                    print(f"ERROR: Vector dimension mismatch for frame {count}: expected {VECTOR_DIM}, got {len(vector)}")
                    return JSONResponse(
                        status_code=500,
                        content={"success": False, "message": f"Vector dimension mismatch: expected {VECTOR_DIM}, got {len(vector)}"}
                    )

                # Store in Qdrant
                qdrant.upsert(
                    collection_name=COLLECTION_NAME,
                    points=[
                        qmodels.PointStruct(
                            id=frame_id, # Use the unique frame_id
                            vector=vector,
                            payload={"frame_path": relative_path, "original_video": video_file.filename}
                        )
                    ]
                )
                print(f"Stored frame {count} (ID: {frame_id}) in Qdrant. Path: {relative_path}")

                frame_results.append({
                    "path": relative_path,
                    "vector": vector
                })

                count += 1

            frame_number += 1

        cap.release()
        print(f"Video capture released for {temp_path}")
        return {"success": True, "frames": frame_results}

    except Exception as e:
        print(f"CRITICAL ERROR during video processing: {e}")
        return JSONResponse(status_code=500, content={"success": False, "message": f"Server error: {str(e)}"})
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            print(f"Deleted temporary video file: {temp_path}")

@app.post("/search-vector")
async def search_vector(request: SearchVectorRequest):
    print(f"Received search request for vector of dimension: {len(request.vector)}")
    if len(request.vector) != VECTOR_DIM:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": f"Search vector dimension mismatch: expected {VECTOR_DIM}, got {len(request.vector)}"
            }
        )

    try:
        search_result = qdrant.search(
            collection_name=COLLECTION_NAME,
            query_vector=request.vector,
            limit=5,
            with_payload=True,
            with_vectors=True  # ✅ Include vector in results
        )
        print(f"Qdrant search returned {len(search_result)} results.")

        results_data = []
        for scored_point in search_result:
            results_data.append({
                "id": scored_point.id,
                "score": scored_point.score,
                "frame_path": scored_point.payload.get("frame_path"),
                "original_video": scored_point.payload.get("original_video"),
                "vector": scored_point.vector  # ✅ Add vector to response
            })

        return {"success": True, "results": results_data}

    except Exception as e:
        print(f"ERROR during Qdrant search: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Server error during search: {str(e)}"}
        )
