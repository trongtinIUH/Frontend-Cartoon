import React from 'react';
import Sidebar from '../../components/Sidebar';

const DashboardPage = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 ms-250 p-4" style={{ marginLeft: '250px' }}>
        <h2>Dashboard</h2>
      <div className="row">
        <div className="col-md-3">
          <div className="card text-white bg-info mb-3 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3>150</h3>
                  <p className="card-text">New Orders</p>
                </div>
                <i className="fas fa-shopping-bag fa-3x"></i>
              </div>
              <a href="#" className="text-white text-decoration-none d-block mt-2">
                More info <i className="fas fa-arrow-circle-right"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-success mb-3 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3>53%</h3>
                  <p className="card-text">Bounce Rate</p>
                </div>
                <i className="fas fa-chart-bar fa-3x"></i>
              </div>
              <a href="#" className="text-white text-decoration-none d-block mt-2">
                More info <i className="fas fa-arrow-circle-right"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-warning mb-3 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3>44</h3>
                  <p className="card-text">User Registrations</p>
                </div>
                <i className="fas fa-user-plus fa-3x"></i>
              </div>
              <a href="#" className="text-white text-decoration-none d-block mt-2">
                More info <i className="fas fa-arrow-circle-right"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-danger mb-3 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3>65</h3>
                  <p className="card-text">Unique Visitors</p>
                </div>
                <i className="fas fa-chart-pie fa-3x"></i>
              </div>
              <a href="#" className="text-white text-decoration-none d-block mt-2">
                More info <i className="fas fa-arrow-circle-right"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>
  );
};

export default DashboardPage;
