import React from 'react';

const About = () => {
  const advantages = [
    {
      icon: '✨',
      title: '精选材料',
      description: '我们只选用优质进口原木和环保材料，确保产品品质和用户健康。'
    },
    {
      icon: '🛠️',
      title: '精湛工艺',
      description: '传统工艺与现代技术结合，每一道工序都经过严格检验。'
    },
    {
      icon: '🔒',
      title: '安全保障',
      description: '采用先进的防盗技术和防火材料，给您全方位的安全保护。'
    },
    {
      icon: '🎨',
      title: '定制设计',
      description: '专业设计团队，根据您的需求和空间，提供个性化定制方案。'
    },
    {
      icon: '👷',
      title: '专业安装',
      description: '经验丰富的安装团队，确保每扇门都完美安装，使用无忧。'
    },
    {
      icon: '💯',
      title: '售后服务',
      description: '五年质保，终身维护，贴心的售后团队随时为您服务。'
    },
  ];

  const stats = [
    { number: '15', label: '年行业经验' },
    { number: '10000+', label: '成功案例' },
    { number: '50+', label: '专业团队' },
    { number: '5', label: '年质保期' },
  ];

  return (
    <section id="about" className="about">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">关于我们</h2>
          <p className="section-subtitle">专注门业十五年，品质铸就未来</p>
        </div>

        <div className="about-content">
          <div className="about-text">
            <h3>专业铸就品质，诚信赢得未来</h3>
            <p>
              我们是一家集研发、设计、生产、销售、服务于一体的专业门业企业。
              自创立以来，始终坚持以"质量第一、客户至上"为经营理念，
              致力于为客户提供高品质、个性化的门业解决方案。
            </p>
            <p>
              十五年来，我们服务了超过一万个家庭和企业客户，
              赢得了良好的市场口碑和客户信赖。我们拥有现代化的生产基地、
              专业的设计团队和经验丰富的安装服务人员，
              能够为客户提供从设计、生产到安装、售后的一站式服务。
            </p>
            <p>
              展望未来，我们将继续秉承"专业、创新、诚信、共赢"的核心价值观，
              不断提升产品品质和服务水平，为客户创造更加美好的家居生活。
            </p>
          </div>

          <div className="about-image">
            <div className="image-placeholder">
              <span className="placeholder-icon">🏭</span>
              <p>现代化生产基地</p>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="advantages-grid">
          {advantages.map((adv, index) => (
            <div key={index} className="advantage-card">
              <div className="advantage-icon">{adv.icon}</div>
              <h4>{adv.title}</h4>
              <p>{adv.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
