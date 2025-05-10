import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Chatbot.css';

function Chatbot({ projectId, projectName }) {
  const [fruitType, setFruitType] = useState('');
  const [city, setCity] = useState('');
  const [result, setResult] = useState('');
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [projectInitialized, setProjectInitialized] = useState(false);
  const [history, setHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskStatus, setTaskStatus] = useState({});

  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Load project data from database when component mounts
  useEffect(() => {
    if (!projectId) {
      console.warn('No projectId provided, cannot load project data');
      return;
    }

    const loadProjectData = async () => {
      try {
        console.log(`Loading data for project-${projectId}`);
        const response = await axios.post('http://localhost:5000/api/project/load', { projectId });
        if (response.data.success) {
          const parsedData = response.data.data;
          setFruitType(parsedData.fruitType || '');
          setCity(parsedData.city || '');
          setResult(parsedData.result || '');
          setWeather(parsedData.weather || null);
          setLocation(parsedData.location || null);
          setProjectInitialized(parsedData.projectInitialized || false);
          setHistory(parsedData.history || []);
          setTasks(parsedData.tasks || []);
          setTaskStatus(parsedData.taskStatus || {});
          console.log(`Successfully loaded data for project-${projectId}`, parsedData);
        } else {
          console.log(`No data found for project-${projectId}`);
        }
      } catch (error) {
        console.error(`Failed to load data for project-${projectId}:`, error);
        setResult('Không thể tải dữ liệu dự án: ' + (error.response?.data?.error || error.message));
      }
    };

    loadProjectData();

    // Focus input and get location only if not initialized
    if (inputRef.current && !projectInitialized) {
      inputRef.current.focus();
    }
    if (!projectInitialized) {
      handleGetLocation();
    }
  }, [projectId, projectInitialized]);

  // Save project data to database whenever relevant state changes
  useEffect(() => {
    if (!projectId) {
      console.warn('No projectId provided, cannot save project data');
      return;
    }

    const saveProjectData = async () => {
      const projectData = {
        fruitType,
        city,
        result,
        weather,
        location,
        projectInitialized,
        history,
        tasks,
        taskStatus,
      };

      try {
        console.log(`Saving data for project-${projectId}`, projectData);
        const response = await axios.post('http://localhost:5000/api/project/save', {
          projectId,
          data: projectData,
        });
        if (response.data.success) {
          console.log(`Successfully saved data for project-${projectId}`);
        } else {
          console.error(`Failed to save data for project-${projectId}:`, response.data.error);
        }
      } catch (error) {
        console.error(`Failed to save data for project-${projectId}:`, error);
      }
    };

    // Only save if the project has been initialized or has meaningful data
    if (projectInitialized || fruitType || city || result || history.length > 0) {
      saveProjectData();
    }
  }, [
    fruitType,
    city,
    result,
    weather,
    location,
    projectInitialized,
    history,
    tasks,
    taskStatus,
    projectId,
  ]);

  // Fetch weather every 10 minutes for real-time updates when city is available
  useEffect(() => {
    if (!city) return;

    // Fetch weather immediately
    fetchWeather(city);

    const intervalId = setInterval(() => {
      console.log(`Fetching real-time weather update for ${city}`);
      fetchWeather(city);
    }, 3600000);

    // Clean up interval on unmount or when city changes
    return () => {
      console.log(`Clearing weather update interval for ${city}`);
      clearInterval(intervalId);
    };
  }, [city]);

  const fetchWeather = async (cityName) => {
    if (!cityName) return;
    setWeatherLoading(true);
    try {
      console.log(`Fetching weather for ${cityName}`);
      const response = await axios.post('http://localhost:5000/api/weather', {
        city: cityName,
      });
      const weatherData = response.data.result;
      // Add timestamp to weather data
      const lastUpdated = new Date().toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      setWeather({ ...weatherData, lastUpdated });
      console.log(`Successfully fetched weather for ${cityName}:`, { ...weatherData, lastUpdated });
    } catch (error) {
      console.error(`Failed to fetch weather for ${cityName}:`, error);
      setWeather({ error: 'Đã xảy ra lỗi: ' + (error.response?.data?.error || error.message) });
    }
    setWeatherLoading(false);
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      setLocation({ error: 'Trình duyệt không hỗ trợ định vị GPS' });
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const locationResponse = await axios.post('http://localhost:5000/api/location', {
            lat: latitude,
            lon: longitude,
          });
          const locationData = locationResponse.data.result;
          setLocation(locationData);
          setCity(locationData.city || '');

          // Weather is fetched automatically via the useEffect when city is set
        } catch (error) {
          console.error('Failed to fetch location:', error);
          setLocation({ error: 'Đã xảy ra lỗi: ' + (error.response?.data?.error || error.message) });
        }
        setLocationLoading(false);
      },
      (error) => {
        console.error('Failed to get GPS position:', error);
        setLocation({ error: 'Không thể lấy vị trí: ' + error.message });
        setLocationLoading(false);
      }
    );
  };

  const getCurrentDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const isTaskForToday = (taskDate) => {
    const currentDate = getCurrentDate();
    return taskDate === currentDate;
  };

  const generateInitialPrompt = () => {
    if (!weather || !city) {
      return 'Vui lòng lấy vị trí và thời tiết trước khi gửi!';
    }
    return `Tôi là một người không biết gì về trồng cây ăn quả. Vậy nên hãy cho tôi cách để trồng cây ${fruitType} dựa vào điều kiện và trả lời đúng khung sau mà không thay đổi:
-Điều kiện: 
+)Vị trí và thời tiết
Ngày hiện tại: ${getCurrentDate()}
Thành phố: ${city}
Nhiệt độ: ${weather.temperature}°C
Mô tả: ${weather.description}
Độ ẩm: ${weather.humidity}%
Tốc độ gió: ${weather.wind_speed} m/s

-Khung:
## Dự án Quyền (ID: ${projectId}): Trồng cây ${fruitType} tại ${city}

•1. Thông tin về giống, loại đất, phân bón, cây con:

•Giống ${fruitType} : [Trả lời]

•Loại đất phù hợp với ${fruitType}: [Trả lời]

•Phân bón phù hợp với ${fruitType}: [Trả lời]

•Cây con phù hợp với ${fruitType}: [Trả lời]

•2. Kỹ thuật và quy trình:

•Bước 1: [Trả lời]

•Bước 2: [Trả lời]
[Thêm các bước nữa nếu có]

•3. Giám sát và chăm sóc (Bắt đầu từ ):

•(Thời gian biểu này là gợi ý, bạn cần điều chỉnh dựa trên tình hình thực tế của cây)

| Ngày | Giờ | Hoạt động | Số liệu/Ghi chú |
| [Trả lời] | [Trả lời] | [Trả lời] |
•Lưu ý: [Trả lời]

•4. Cập nhật từ bạn:

[Tự trả lời]`;
  };

  const generateUpdatePrompt = () => {
    const currentDate = getCurrentDate();
    const lastHistory = history.length > 0 ? history[history.length - 1] : null;
    const lastResult = lastHistory ? lastHistory.result : '';
    
    // Extract completed and pending tasks
    const completedTasks = Object.entries(taskStatus)
      .filter(([_, status]) => status)
      .map(([task]) => task);
    const pendingTasks = Object.entries(taskStatus)
      .filter(([_, status]) => !status)
      .map(([task]) => task);

    return `Hôm nay ngày ${currentDate} tôi đã làm ${completedTasks.length > 0 ? completedTasks.join(', ') : 'không có gì'} và chưa làm ${pendingTasks.length > 0 ? pendingTasks.join(', ') : 'không có gì'}. In ra kết quả theo khung kế hoạch dưới cho hôm nay và hôm sau dựa theo điều trước và những điều sau: 
- Điều một: 
${lastResult}

-Khung: 
(Thời gian biểu này là gợi ý, bạn cần điều chỉnh dựa trên tình hình thực tế của cây)
+ Những điều cần làm trong hôm nay: 
[Trả lời] 
+ Kế hoạch cho những ngày sau:
| Ngày | Giờ | Hoạt động | Số liệu/Ghi chú |
| [Trả lời] | [Trả lời] | [Trả lời] |
•Lưu ý: [Trả lời]`;
  };

  const handleSubmitPrompt = async (e) => {
    e.preventDefault();
    if (!fruitType.trim()) {
      setResult('Vui lòng nhập loại quả!');
      return;
    }
    if (!weather || !city) {
      setResult('Vui lòng lấy vị trí và thời tiết trước!');
      return;
    }
    setLoading(true);
    const prompt = generateInitialPrompt();
    try {
      const response = await axios.post('http://localhost:5000/api/generate', {
        prompt: `Dự án ${projectName} (ID: ${projectId}): ${prompt}`,
      });
      const newResult = response.data.result;
      setResult(newResult);
      setProjectInitialized(true);
      const date = getCurrentDate();
      setHistory([...history, { date, prompt, result: newResult }]);

      // Extract tasks from the "Giám sát và chăm sóc" section
      const taskSection = newResult.split('•3. Giám sát và chăm sóc')[1]?.split('•4. Cập nhật từ bạn')[0] || '';
      const tableRows = taskSection.match(/\|.*\|.*\|.*\|.*\|/g) || [];
      const extractedTasks = tableRows
        .map(row => {
          const [, date, time, activity] = row.split('|').map(s => s.trim());
          return { date, time, activity };
        })
        .filter(task => task.date && task.time && task.activity);
      
      setTasks(extractedTasks);
      setTaskStatus(extractedTasks.reduce((acc, task) => ({
        ...acc,
        [`${task.date} - ${task.activity}`]: false
      }), {}));
    } catch (error) {
      console.error('Failed to submit prompt:', error);
      setResult('Đã xảy ra lỗi: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const updatePrompt = generateUpdatePrompt();
    try {
      const response = await axios.post('http://localhost:5000/api/generate', {
        prompt: `Dự án ${projectName} (ID: ${projectId}): ${updatePrompt}`,
      });
      const newResult = response.data.result;
      setResult(newResult);
      const date = getCurrentDate();
      setHistory([...history, { date, prompt: updatePrompt, result: newResult }]);

      // Extract new tasks from the response
      const taskSection = newResult.split('+ Kế hoạch cho những ngày sau:')[1]?.split('•Lưu ý:')[0] || '';
      const tableRows = taskSection.match(/\|.*\|.*\|.*\|.*\|/g) || [];
      const extractedTasks = tableRows
        .map(row => {
          const [, date, time, activity] = row.split('|').map(s => s.trim());
          return { date, time, activity };
        })
        .filter(task => task.date && task.time && task.activity);
      
      setTasks(extractedTasks);
      setTaskStatus(extractedTasks.reduce((acc, task) => ({
        ...acc,
        [`${task.date} - ${task.activity}`]: false
      }), {}));
    } catch (error) {
      console.error('Failed to update prompt:', error);
      setResult('Đã xảy ra lỗi: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  // Function to clear project data from database
  const handleClearProject = async () => {
    if (!projectId) {
      console.warn('No projectId provided, cannot delete project data');
      return;
    }

    try {
      console.log(`Deleting data for project-${projectId}`);
      const response = await axios.post('http://localhost:5000/api/project/delete', { projectId });
      if (response.data.success) {
        console.log(`Successfully deleted data for project-${projectId}`);
        setFruitType('');
        setCity('');
        setResult('');
        setWeather(null);
        setLocation(null);
        setProjectInitialized(false);
        setHistory([]);
        setTasks([]);
        setTaskStatus({});
      } else {
        console.error(`Failed to delete data for project-${projectId}:`, response.data.error);
        setResult('Không thể xóa dữ liệu dự án: ' + response.data.error);
      }
    } catch (error) {
      console.error(`Failed to delete data for project-${projectId}:`, error);
      setResult('Không thể xóa dữ liệu dự án: ' + (error.response?.data?.error || error.message));
    }
  };

  // Function to navigate back to homepage
  const handleBackToHomepage = () => {
    console.log(`Navigating to homepage from project-${projectId}`);
    navigate('/');
  };

  return (
    <div className="outer-container">
      <div className="left-table">
        <div className="table-container">
          <h3 className="section-title">Giám sát và chăm sóc (Bắt đầu từ 07/05/2025)</h3>
          <table className="monitoring-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Giờ</th>
                <th>Hoạt động</th>
                <th>Số liệu/Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>07/05/2025</td>
                <td>Sáng</td>
                <td>Kiểm tra độ ẩm đất, tưới nước nếu cần</td>
                <td>Ghi chú lượng nước tưới</td>
              </tr>
              <tr>
                <td>14/05/2025</td>
                <td>Chiều</td>
                <td>Kiểm tra cây có sâu bệnh không, xử lý nếu cần</td>
                <td>Ghi chú loại sâu bệnh, phương pháp xử lý</td>
              </tr>
              <tr>
                <td>21/05/2025</td>
                <td>Sáng</td>
                <td>Bón phân thúc (nếu cần)</td>
                <td>Ghi chú loại phân, lượng phân</td>
              </tr>
              <tr>
                <td>28/05/2025</td>
                <td>Chiều</td>
                <td>Kiểm tra lại độ ẩm đất, tưới nước nếu cần</td>
                <td>Ghi chú lượng nước tưới</td>
              </tr>
            </tbody>
          </table>
          <div className="notes">
            <p><strong>Lưu ý:</strong> Khí hậu Hà Nội mùa hè nắng nóng, cần chú ý tưới nước thường xuyên, đặc biệt trong những ngày nắng gắt. Theo dõi cây thường xuyên để phát hiện và xử lý kịp thời sâu bệnh. Tham khảo ý kiến của người có kinh nghiệm trồng cam hoặc cán bộ nông nghiệp để được hướng dẫn cụ thể hơn.</p>
          </div>
        </div>
      </div>
      <div className="chatbot-container">
        <div className="header-container">
          <h2 className="chatbot-title">Chatbot cho dự án {projectName || 'Không xác định'}</h2>
          <button onClick={handleBackToHomepage} className="back-button">
            Quay lại trang chủ
          </button>
        </div>
  
        {!projectId ? (
          <p className="error-message">Lỗi: Không tìm thấy ID dự án. Vui lòng quay lại và chọn dự án.</p>
        ) : !projectInitialized ? (
          <>
            <h3 className="section-title">Hỏi về cách trồng cây ăn quả</h3>
            <form onSubmit={handleSubmitPrompt} className="input-form">
              <input
                ref={inputRef}
                type="text"
                value={fruitType}
                onChange={(e) => setFruitType(e.target.value)}
                placeholder="Nhập loại quả (VD: Xoài)"
                className="fruit-input"
                disabled={projectInitialized}
              />
              <br />
              <button type="submit" disabled={loading || !weather || !city || projectInitialized} className="submit-button">
                {loading ? 'Đang xử lý...' : 'Gửi'}
              </button>
            </form>
            <h3 className="section-title">Lấy vị trí của bạn</h3>
            <button onClick={handleGetLocation} disabled={locationLoading} className="location-button">
              {locationLoading ? 'Đang lấy vị trí...' : 'Lấy vị trí GPS'}
            </button>
          </>
        ) : (
          <>
            <h3 className="section-title">Cập nhật tiến độ [{getCurrentDate()}]</h3>
            <form onSubmit={handleUpdateSubmit} className="update-form">
              {tasks.length > 0 ? (
                tasks
                  .filter(task => isTaskForToday(task.date))
                  .map((task, index) => (
                    <div key={index} className="task-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={taskStatus[`${task.date} - ${task.activity}`] || false}
                          onChange={(e) => setTaskStatus({
                            ...taskStatus,
                            [`${task.date} - ${task.activity}`]: e.target.checked
                          })}
                        />
                        {task.activity} ({task.date} - {task.time})
                      </label>
                    </div>
                  ))
              ) : (
                <p>Không có nhiệm vụ nào để cập nhật cho hôm nay.</p>
              )}
              <button type="submit" disabled={loading} className="submit-button">
                {loading ? 'Đang xử lý...' : 'Cập nhật'}
              </button>
              <button type="button" onClick={handleClearProject} className="clear-button">
                Xóa dự án
              </button>
            </form>
          </>
        )}
        <div className="result-container">
          <h3 className="section-title">Kết quả:</h3>
          <div className="result-box">
            {result.split('\n').map((line, index) => (
              line.trim() ? (
                <p key={index} className="result-text">
                  {line.includes('*') ? (
                    <span className="bullet-point">•</span>
                  ) : null}
                  {line.replace(/\*/g, '').trim()}
                </p>
              ) : null
            ))}
          </div>
        </div>
  
        <h3 className="section-title">Lịch sử Prompt</h3>
        <div className="history-container">
          {history.map((entry, index) => (
            <div key={index} className="history-entry">
              <h4>[{entry.date}]</h4>
              <p><strong>Prompt:</strong> {entry.prompt}</p>
              <p><strong>Kết quả:</strong> {entry.result}</p>
            </div>
          ))}
        </div>
      </div>
  
      <div className="right-card">
        <div className="weather-card">
          <div className="weather-content">
            <div className="weather-header">
              <div>
                <h3 className="weather-city">Thời tiết tại {city || 'vị trí của bạn'}</h3>
                {location && !location.error && (
                  <p className="weather-location">Địa chỉ: {location.address || 'Không xác định'}</p>
                )}
                {weather && !weather.error && (
                  <p className="weather-time">Cập nhật lúc: {weather.lastUpdated}</p>
                )}
              </div>
            </div>
            <div className="weather-main">
              {weatherLoading ? (
                <p>Đang tải thời tiết...</p>
              ) : weather && !weather.error ? (
                <div>
                  <div className="weather-temp">
                    <span className="temp-value">{weather.temperature}°</span>
                    <span className="temp-unit">C</span>
                  </div>
                  <div className="weather-icon">
                    <svg className="weather-symbol" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <p>{weather?.error || 'Chưa có dữ liệu thời tiết'}</p>
              )}
            </div>
            <div className="weather-details">
              {weather && !weather.error && (
                <>
                  <div className="weather-item">
                    <svg className="weather-icon-small" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span>Độ ẩm: {weather.humidity}%</span>
                  </div>
                  <div className="weather-item">
                    <svg className="weather-icon-small" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                    </svg>
                    <span>Tốc độ gió: {weather.wind_speed} m/s</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;