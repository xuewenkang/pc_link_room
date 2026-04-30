import React, { useState, useEffect } from 'react';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"%3E%3Crect fill="%23f5f5f5" width="1200" height="600"/%3E%3Ctext x="50%" y="30%" font-family="Arial" font-size="48" fill="%23333" text-anchor="middle" opacity="0.1"%3E🚪 高端门业 🚪%3C/text%3E%3Ctext x="50%" y="45%" font-family="Arial" font-size="24" fill="%23666" text-anchor="middle" opacity="0.1"%3E专业定制 · 品质保证%3C/text%3E%3C/svg%3E',
      title: '高端定制门业',
      subtitle: '为您的空间增添尊贵与安全',
      description: '精选优质材料，精湛工艺打造，每一扇门都是艺术品。提供专业测量、设计、安装一站式服务，让您的家居更加完美。',
      buttonText: '立即定制'
    },
    {
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"%3E%3Crect fill="%23e8f4f8" width="1200" height="600"/%3E%3Ctext x="50%" y="30%" font-family="Arial" font-size="48" fill="%230066cc" text-anchor="middle" opacity="0.1"%3E🔒 安全防护 🔒%3C/text%3E%3Ctext x="50%" y="45%" font-family="Arial" font-size="24" fill="%230066cc" text-anchor="middle" opacity="0.1"%3E防盗防火 · 智能安全%3C/text%3E%3C/svg%3E',
      title: '智能安全门',
      subtitle: '科技守护您的安全',
      description: '集成智能指纹识别、视频监控、远程控制等功能，提供全方位的安全保障。防撬、防火、隔音，让您的家居更加安全舒适。',
      buttonText: '了解更多'
    },
    {
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"%3E%3Crect fill="%23f8f4e8" width="1200" height="600"/%3E%3Ctext x="50%" y="30%" font-family="Arial" font-size="48" fill="%23b38b00" text-anchor="middle" opacity="0.1"%3E✨ 豪华设计 ✨%3C/text%3E%3Ctext x="50%" y="45%" font-family="Arial" font-size="24" fill="%23b38b00" text-anchor="middle" opacity="0.1"%3E艺术品味 · 独特风格%3C/text%3E%3C/svg%3E',
      title: '艺术实木门',
      subtitle: '品味艺术，享受生活',
      description: '精选进口实木，经过多道工序精细处理。古典、现代、简约、奢华，多种风格任您选择，为您的家居增添独特魅力。',
      buttonText: '查看产品'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleNavigation = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleIndicatorClick = (index) => {
    setCurrentSlide(index);
  };

  return (
    <section id="home" className="hero">
      <div className="hero-slider">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="hero-content">
              <h1 className="hero-title">{slide.title}</h1>
              <p className="hero-subtitle">{slide.subtitle}</p>
              <p className="hero-description">{slide.description}</p>
              <div className="hero-buttons">
                <button className="btn-primary" onClick={handleNavigation}>
                  {slide.buttonText}
                </button>
                <button className="btn-secondary" onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}>
                  浏览产品
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hero-indicators">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`indicator ${index === currentSlide ? 'active' : ''}`}
            onClick={() => handleIndicatorClick(index)}
          ></div>
        ))}
      </div>
    </section>
  );
};

export default Hero;
