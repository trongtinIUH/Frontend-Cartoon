import React from "react";
import { Link } from "react-router-dom";
import TOPICS from "../constants/topics";
import "../css/componentsCSS/TopicSection.css";

const TopicSection = () => {
  const visibleTopics = TOPICS.slice(0, 6);
  const hiddenTopics = TOPICS.slice(6);


  
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", 
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",

  ];

  const getRandomGradient = () => {
    return gradients[Math.floor(Math.random() * gradients.length)];
  }; 
  return (
    <div className="topics-section container mb-5">
      <h2 className="section-title"><span role="img"></span> Bạn đang quan tâm gì?</h2>
      <div className="row gx-3 gy-3">
        {visibleTopics.map((topic, index) => (
          <div className="col-6 col-sm-4 col-md-2" key={index}>
            <div className="topic-card" style={{ backgroundImage: getRandomGradient() }}>
              <h5>{topic}</h5>
              <Link to={`/chu-de/${topic}`}>Xem chủ đề &rsaquo;</Link>
            </div>
          </div>
        ))}
        {hiddenTopics.length > 0 && (
          <div className="col-6 col-sm-4 col-md-2">
            <div className="topic-card see-more">
              <Link to="/all-topics">+{hiddenTopics.length} chủ đề</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicSection;
