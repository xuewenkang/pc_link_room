import React, { useState, useEffect } from 'react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="nav-brand" onClick={() => handleNavigation('home')}>
          <span className="logo-icon">🎯</span>
          <span className="logo-text">高端门业</span>
        </div>

        <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <div className="nav-item" onClick={() => handleNavigation('home')}>首页</div>
          <div className="nav-item" onClick={() => handleNavigation('products')}>产品中心</div>
          <div className="nav-item" onClick={() => handleNavigation('about')}>关于我们</div>
          <div className="nav-item" onClick={() => handleNavigation('contact')}>联系我们</div>
          <div className="nav-btn">
            <button className="btn-primary" onClick={() => handleNavigation('contact')}>
              立即咨询
            </button>
          </div>
        </div>

        <div
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
