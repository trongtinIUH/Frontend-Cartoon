import React from "react";
import TOPICS from "../constants/topics";
import { Link } from "react-router-dom";
import "../css/AllTopicsPage.css";

const AllTopicsPage = () => {
    const gradients = [
  "linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%)",
  "linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)",
  "linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)",
  "linear-gradient(to top, #30cfd0 0%, #330867 100%)",
];

const getRandomGradient = () => {
  const index = Math.floor(Math.random() * gradients.length);
  return gradients[index];
};

  return (
<div className="all-topics-wrapper">
    <div className="all-topics-page py-5" >
      <h2 className="section-title">Các chủ đề</h2>
      <div className="row gy-4">
        {TOPICS.map((topic, index) => (
          <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={index}>
            <div className="topic-box" style={{ backgroundImage: getRandomGradient() }}>
              <h5>{topic}</h5>
              <Link to={`/chu-de/${topic}`}>Xem toàn bộ &rsaquo;</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
   </div> 
  );
};

export default AllTopicsPage;
