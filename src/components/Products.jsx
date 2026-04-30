import React, { useState } from 'react';

const Products = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: '全部产品' },
    { id: 'wooden', name: '实木门' },
    { id: 'security', name: '安全门' },
    { id: 'glass', name: '玻璃门' },
    { id: 'smart', name: '智能门' },
  ];

  const products = [
    {
      id: 1,
      name: '欧式经典实木门',
      category: 'wooden',
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%238B4513" width="400" height="400" rx="8"/%3E%3Ctext x="50%" y="45%" font-family="Arial" font-size="48" fill="%23fff" text-anchor="middle"%3E🚪%3C/text%3E%3Ctext x="50%" y="65%" font-family="Arial" font-size="14" fill="%23fff" text-anchor="middle"%3E实木门%3C/text%3E%3C/svg%3E',
      price: '¥3,888',
      description: '精选进口橡木，传统工艺雕刻，尊贵典雅'
    },
    {
      id: 2,
      name: '现代简约安全门',
      category: 'security',
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23607D8B" width="400" height="400" rx="8"/%3E%3Ctext x="50%" y="45%" font-family="Arial" font-size="48" fill="%23fff" text-anchor="middle"%3E🔒%3C/text%3E%3Ctext x="50%" y="65%" font-family="Arial" font-size="14" fill="%23fff" text-anchor="middle"%3E安全门%3C/text%3E%3C/svg%3E',
      price: '¥4,588',
      description: '加厚钢板，防撬设计，C级防盗锁，安全可靠'
    },
    {
      id: 3,
      name: '豪华玻璃门',
      category: 'glass',
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23E3F2FD" width="400" height="400" rx="8"/%3E%3Ctext x="50%" y="45%" font-family="Arial" font-size="48" fill="%230288D1" text-anchor="middle"%3E🪟%3C/text%3E%3Ctext x="50%" y="65%" font-family="Arial" font-size="14" fill="%230288D1" text-anchor="middle"%3E玻璃门%3C/text%3E%3C/svg%3E',
      price: '¥3,288',
      description: '钢化玻璃，铝合金边框，现代简约风格'
    },
    {
      id: 4,
      name: '智能指纹锁门',
      category: 'smart',
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%2337474F" width="400" height="400" rx="8"/%3E%3Ctext x="50%" y="45%" font-family="Arial" font-size="48" fill="%23fff" text-anchor="middle"%3E📱%3C/text%3E%3Ctext x="50%" y="65%" font-family="Arial" font-size="14" fill="%23fff" text-anchor="middle"%3E智能门%3C/text%3E%3C/svg%3E',
      price: '¥6,888',
      description: '指纹识别，密码解锁，远程控制，智能安全'
    },
    {
      id: 5,
      name: '中式原木大门',
      category: 'wooden',
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%235D4037" width="400" height="400" rx="8"/%3E%3Ctext x="50%" y="45%" font-family="Arial" font-size="48" fill="%23fff" text-anchor="middle"%3E🏮%3C/text%3E%3Ctext x="50%" y="65%" font-family="Arial" font-size="14" fill="%23fff" text-anchor="middle"%3E原木大门%3C/text%3E%3C/svg%3E',
      price: '¥5,688',
      description: '进口花梨木，传统榫卯工艺，中式韵味'
    },
    {
      id: 6,
      name: '防火防盗门',
      category: 'security',
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23BF360C" width="400" height="400" rx="8"/%3E%3Ctext x="50%" y="45%" font-family="Arial" font-size="48" fill="%23fff" text-anchor="middle"%3E🔥%3C/text%3E%3Ctext x="50%" y="65%" font-family="Arial" font-size="14" fill="%23fff" text-anchor="middle"%3E防火门%3C/text%3E%3C/svg%3E',
      price: '¥4,988',
      description: 'A级防火标准，耐火3小时，兼具防盗功能'
    },
  ];

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  const handleProductClick = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="products" className="products">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">产品中心</h2>
          <p className="section-subtitle">精心打造每一扇门，为您的生活增添品质</p>
        </div>

        <div className="product-categories">
          {categories.map(category => (
            <div
              key={category.id}
              className={`category-tag ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </div>
          ))}
        </div>

        <div className="product-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img src={product.image} alt={product.name} />
                <div className="product-overlay">
                  <button className="btn-secondary" onClick={handleProductClick}>
                    立即咨询
                  </button>
                </div>
              </div>
              <div className="product-content">
                <div className="product-name">{product.name}</div>
                <div className="product-price">{product.price}</div>
                <p className="product-description">{product.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;
