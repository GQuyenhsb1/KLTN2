import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import characImage from '../assets/logo3.png'; 
import wea from '../assets/p1.png'; 
import ai from '../assets/p2.png'; 
import farm from '../assets/p4.png';

function HomePage({ addProject, projects, setProjects }) {
  return (
    <div className="home">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="logo">
          <span className="logo-text">AgriGuard</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/">Trang Chủ</Link></li>
          <li><Link to="/about">Dự Án</Link></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-left">
          <img src={characImage} style={{ width: '400px', height: '400px' }} alt="Character" className="charac-image" />
        </div>
        <div className="hero-right">
          <h1 className="hero-title">AgriGuard</h1>
          <p className="hero-tagline">"Chăm cây bằng dữ liệu, gặt hái bằng niềm tin"</p>
          <Link to="/about" className="get-started-button">Bắt Đầu</Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="feature-card">
          <h3>Theo dõi thời tiết</h3>
          <p>Kết nối với dữ liệu thời gian thực</p>
          <img src={wea} style={{ width: '150px', height: '150px' }} alt="Character" />
        </div>
        <div className="feature-card">
          <h3>Tư vấn qua AI</h3>
          <p>Cung cấp những thông tin và hướng dẫn về nuôi trồng</p>
          <img src={ai} style={{ width: '150px', height: '150px' }} alt="Character" />
        </div>
        <div className="feature-card">
          <h3>"Bản đồ" nuôi trồng</h3>
          <p>Kiểm soát cây trồng thông qua dữ liệu GPS</p>
          <img src={farm} style={{ width: '150px', height: '150px' }} alt="Character" />
        </div>
      </div>
    </div>
  );
}

export default HomePage;