import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';

function About({ addProject, projects, setProjects }) {
  const [projectName, setProjectName] = useState('');
  const [notifications, setNotifications] = useState([]);

  // Fetch project task data from history for notifications (today only)
  const fetchProjectTasks = async () => {
    try {
      const currentTime = new Date();
      const currentDate = currentTime.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).split('/').join('/');
      const currentHourMinute = currentTime.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const newNotifications = [];

      // Fetch history for each project
      for (const project of projects) {
        try {
          const response = await axios.post('http://localhost:5000/api/project/load', {
            projectId: project.id,
          });
          if (response.data.success) {
            const { history = [], taskStatus = {} } = response.data.data;

            // Process history entries
            history.forEach((entry) => {
              let taskSection = '';
              // Initial prompt: Extract from "Giám sát và chăm sóc"
              if (entry.prompt.includes('cách để trồng cây')) {
                taskSection = entry.result.split('•3. Giám sát và chăm sóc')[1]?.split('•4. Cập nhật từ bạn')[0] || '';
              }
              // Update prompt: Extract from "Kế hoạch cho những ngày sau"
              else if (entry.prompt.includes('Cập nhật tiến độ')) {
                taskSection = entry.result.split('+ Kế hoạch cho những ngày sau:')[1]?.split('•Lưu ý:')[0] || '';
              }

              // Parse task table
              const tableRows = taskSection.match(/\|.*\|.*\|.*\|.*\|/g) || [];
              const tasks = tableRows
                .map((row) => {
                  const [, date, time, activity] = row.split('|').map((s) => s.trim());
                  return { date, time, activity };
                })
                .filter((task) => task.date && task.time && task.activity);

              // Filter tasks for today and check due/overdue
              tasks.forEach((task) => {
                if (task.date === currentDate && !taskStatus[`${task.date} - ${task.activity}`]) {
                  const [taskHour, taskMinute] = task.time.split(':').map(Number);
                  const [currentHour, currentMinute] = currentHourMinute.split(':').map(Number);
                  const taskTimeInMinutes = taskHour * 60 + taskMinute;
                  const currentTimeInMinutes = currentHour * 60 + currentMinute;
                  const timeDiff = Math.abs(taskTimeInMinutes - currentTimeInMinutes);

                  // Include due tasks (±1 minute) or overdue tasks (earlier today)
                  if (timeDiff <= 1 || taskTimeInMinutes < currentTimeInMinutes) {
                    newNotifications.push({
                      projectId: project.id,
                      projectName: project.name,
                      activity: task.activity,
                      time: task.time,
                      date: task.date,
                    });
                  }
                }
              });
            });
          }
        } catch (error) {
          console.error(`Failed to load tasks for project-${project.id}:`, error);
        }
      }

      setNotifications(newNotifications);
      console.log('Checked tasks from history for notifications (today only):', newNotifications);
    } catch (error) {
      console.error('Error fetching project tasks:', error);
    }
  };

  // Check tasks every minute for real-time notifications
  useEffect(() => {
    fetchProjectTasks(); // Initial fetch
    const intervalId = setInterval(() => {
      console.log('Checking tasks from history for real-time notifications (today only)');
      fetchProjectTasks();
    }, 60000); // Every 1 minute

    return () => {
      console.log('Clearing notification interval');
      clearInterval(intervalId);
    };
  }, [projects]);

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert('Vui lòng nhập tên dự án!');
      return;
    }
    const newProject = {
      id: Date.now(),
      name: projectName,
      createdAt: new Date().toLocaleString(),
      patientData: {},
    };
    addProject(newProject);
    setProjectName('');
  };

  const handleClearData = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu?')) {
      setProjects([]);
      setNotifications([]);
    }
  };

  return (
    <div className="about">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-text">AgriGuard</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/">Trang Chủ</Link></li>
        <li><Link to="/about">Dự Án</Link></li>
        </ul>
      </nav>

      <main className="container">
        <div className="card project-card">
          <label className="title">Quản Lý Dự Án</label>
          <div className="content">
            <div className="section">
              <span>Tạo Dự Án</span>
              <form onSubmit={handleCreateProject} className="form">
                <input
                  type="text"
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Nhập tên dự án..."
                  className="input_field"
                  required
                />
                <button type="submit">Tạo Dự Án Mới</button>
              </form>
            </div>
            <hr />
            <div className="section notifications">
              <span>Thông Báo</span>
              {notifications.length === 0 ? (
                <p>Không có thông báo nào.</p>
              ) : (
                <ul>
                  {notifications.map((notification, index) => (
                    <li key={index} className="notification-item">
                      <Link to={`/project/${notification.projectId}`}>
                        {notification.projectName}: {notification.activity} lúc {notification.time} ({notification.date})
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <hr />
            <div className="section project-list">
              <span>Danh Sách Dự Án</span>
              {projects.length === 0 ? (
                <p>Chưa có dự án nào.</p>
              ) : (
                <>
                  <button onClick={handleClearData} className="clear-btn">
                    Xóa tất cả dữ liệu
                  </button>
                  <ul>
                    {projects.map((project) => (
                      <li key={project.id} className="project-item">
                        <Link to={`/project/${project.id}`}>
                          {project.name} <span>({project.createdAt})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default About;