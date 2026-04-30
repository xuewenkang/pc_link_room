import React from 'react';

const Footer = () => {
  const footerLinks = [
    {
      title: '关于我们',
      links: ['公司简介', '发展历程', '荣誉资质', '新闻资讯'],
    },
    {
      title: '产品中心',
      links: ['实木门', '安全门', '玻璃门', '智能门'],
    },
    {
      title: '服务支持',
      links: ['安装指南', '售后服务', '常见问题', '维修服务'],
    },
    {
      title: '联系我们',
      links: ['在线客服', '电话咨询', '联系表单', '地图导航'],
    },
  ];

  const handleNavigation = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-column">
            <div className="footer-brand">
              <span className="logo-icon">🎯</span>
              <span className="logo-text">高端门业</span>
            </div>
            <p className="footer-description">
              专注门业十五年，为您提供高品质的门业解决方案。
              我们以专业的技术、优质的服务，
              让每一位客户都能享受到安全、舒适的生活空间。
            </p>
            <div className="footer-social">
              <div className="social-link">📱</div>
              <div className="social-link">🐦</div>
              <div className="social-link">📸</div>
              <div className="social-link">💬</div>
            </div>
          </div>

          {footerLinks.map((column, index) => (
            <div key={index} className="footer-column">
              <h4 className="footer-heading">{column.title}</h4>
              <div className="footer-links">
                {column.links.map((link, linkIndex) => (
                  <div
                    key={linkIndex}
                    className="footer-link"
                    onClick={() => {
                      if (column.title === '产品中心') {
                        handleNavigation('products');
                      } else if (column.title === '关于我们') {
                        handleNavigation('about');
                      } else if (column.title === '联系我们') {
                        handleNavigation('contact');
                      }
                    }}
                  >
                    {link}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <div className="copyright">
            © 2026 高端门业 | 专业门业解决方案提供商
          </div>
          <div className="footer-legal">
            <div className="legal-link">隐私政策</div>
            <div className="legal-link">服务条款</div>
            <div className="legal-link">网站地图</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
