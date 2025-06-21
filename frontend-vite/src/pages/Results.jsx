// // src/components/Results.jsx
// import React from "react";
// import { useLocation } from "react-router-dom";

// const Results = () => {
//   const location = useLocation();
//   const { searchResults, selectedVector } = location.state || {}; // Get data from navigation state

//   return (
//     <div className="results-container">
//       <h2>Search Results</h2>
//       {selectedVector && (
//         <div>
//           <h3>Vector Used for Search:</h3>
//           <div className="vector-display">
//             {selectedVector.map((val, i) => (
//               <span key={i}>{val.toFixed(2)} </span>
//             ))}
//           </div>
//         </div>
//       )}
//       {searchResults && searchResults.length > 0 ? (
//         <div className="search-results-grid">
//           {searchResults.map((result, index) => (
//             <div key={index} className="search-result-item">
//               <h4>Result {index + 1}</h4>
//               {/* Assuming your search results contain an image path or other displayable data */}
//               <p>{result.name}</p>{" "}
//               {/* Example: Display a name from the result */}
//               {result.imagePath && (
//                 <img src={result.imagePath} alt={`result-${index}`} />
//               )}
//               {/* You'll need to adapt this based on the actual structure of your searchResults */}
//             </div>
//           ))}
//         </div>
//       ) : (
//         <p>No search results found.</p>
//       )}
//     </div>
//   );
// };

// export default Results;
import React from "react";
import { useLocation } from "react-router-dom";
import "./Results.css";
const Results = () => {
  const location = useLocation();
  const { searchResults, selectedVector } = location.state || {};

  return (
    <div className="results-container">
      <h2>Search Results</h2>

      {selectedVector && (
        <div>
          <h3>Vector Used for Search:</h3>
          <div className="vector-display">
            {selectedVector.map((val, i) => (
              <span key={i}>{val.toFixed(2)} </span>
            ))}
          </div>
        </div>
      )}

      {searchResults && searchResults.length > 0 ? (
        <div className="search-results-grid">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="search-result-item"
              style={{ marginBottom: "20px" }}
            >
              <h4>Result {index + 1}</h4>
              <img src={`${result.frame_path}`} alt={`result-${index}`} />

              <p>
                <strong>Score:</strong> {result.score.toFixed(4)}
              </p>
              <div>
                <strong>Vector:</strong>
                <div style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
                  {result.vector?.map((val, i) => (
                    <span key={i}>{val.toFixed(2)} </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No search results found.</p>
      )}
    </div>
  );
};

export default Results;
