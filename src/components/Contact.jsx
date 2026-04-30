import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', phone: '', email: '', message: '' });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: '📍',
      title: '公司地址',
      content: '北京市朝阳区建国路88号',
    },
    {
      icon: '📞',
      title: '服务热线',
      content: '400-888-8888',
    },
    {
      icon: '📧',
      title: '电子邮箱',
      content: 'service@door.com',
    },
    {
      icon: '🕐',
      title: '营业时间',
      content: '周一至周日 9:00-18:00',
    },
  ];

  return (
    <section id="contact" className="contact">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">联系我们</h2>
          <p className="section-subtitle">随时为您提供专业服务</p>
        </div>

        <div className="contact-wrapper">
          <div className="contact-info">
            {contactInfo.map((item, index) => (
              <div key={index} className="contact-item">
                <div className="contact-icon">{item.icon}</div>
                <div className="contact-detail">
                  <h4>{item.title}</h4>
                  <p>{item.content}</p>
                </div>
              </div>
            ))}

            <div className="contact-map">
              <div className="map-placeholder">
                <span>🗺️</span>
                <p>地图位置</p>
              </div>
            </div>
          </div>

          <div className="contact-form-wrapper">
            <div className="form-card">
              <h3>在线咨询</h3>
              {isSubmitted ? (
                <div className="success-message">
                  <span className="success-icon">✓</span>
                  <p>提交成功！我们会尽快与您联系。</p>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">您的姓名 *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="请输入您的姓名"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">联系电话 *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="请输入您的电话"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">电子邮箱</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="请输入您的邮箱"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">咨询内容 *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="请详细描述您的需求..."
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="btn-primary btn-large">
                    提交咨询
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
