import React from 'react';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children, darkMode, setDarkMode }) => (
  <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <Header darkMode={darkMode} setDarkMode={setDarkMode} />
    <main className="flex-grow container mx-auto px-4 py-8">
      {children}
    </main>
    <Footer />
  </div>
);

export default Layout;