import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Web3Provider } from './contexts/Web3Context';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Deals from './pages/Deals';
import Manager from './pages/Manager';

function App() {
  const [darkMode, setDarkMode] = useState(true); 

  useEffect(() => {
    const rootElement = document.documentElement; // Select the <html> element
    if (darkMode) {
      rootElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
    }
  }, [darkMode]);

  
  return(
  
    
  <Web3Provider>
    <Router>
    <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/manager" element={<Manager />} />
        </Routes>
        </div>
      </Layout>
    </Router>
    <ToastContainer />
  </Web3Provider>
  
  
);
}
export default App;