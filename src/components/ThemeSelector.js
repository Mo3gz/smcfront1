import React, { useState, useEffect } from 'react';

const ThemeSelector = () => {
  const [currentTheme, setCurrentTheme] = useState('ocean');

  const themes = [
    { id: 'ocean', name: '🌊 المحيط', description: 'أزرق-أخضر عصري' },
    { id: 'sunset', name: '🌅 الغروب', description: 'بنفسجي-وردي رومانسي' },
    { id: 'nature', name: '🌿 الطبيعة', description: 'أخضر-أزرق هادئ' },
    { id: 'sunrise', name: '🌅 الشروق', description: 'برتقالي-أصفر دافئ' },
    { id: 'dark', name: '🌙 الليل', description: 'داكن أنيق' }
  ];

  useEffect(() => {
    // استرجاع الثيم المحفوظ
    const savedTheme = localStorage.getItem('selectedTheme') || 'ocean';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeId) => {
    // إزالة جميع كلاسات الثيم
    document.body.classList.remove('theme-ocean', 'theme-sunset', 'theme-nature', 'theme-sunrise', 'theme-dark');
    
    // إضافة الكلاس الجديد
    document.body.classList.add(`theme-${themeId}`);
    
    // حفظ الثيم في localStorage
    localStorage.setItem('selectedTheme', themeId);
  };

  const handleThemeChange = (themeId) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(15px)',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '0 8px 25px rgba(14, 165, 233, 0.15)',
      border: '1px solid rgba(14, 165, 233, 0.1)',
      minWidth: '200px'
    }}>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        color: '#333', 
        fontSize: '16px',
        fontWeight: '600'
      }}>
        🎨 اختيار الألوان
      </h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              border: currentTheme === theme.id ? '2px solid #0ea5e9' : '1px solid rgba(14, 165, 233, 0.2)',
              borderRadius: '12px',
              background: currentTheme === theme.id ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              fontWeight: currentTheme === theme.id ? '600' : '400'
            }}
            onMouseOver={(e) => {
              if (currentTheme !== theme.id) {
                e.target.style.background = 'rgba(14, 165, 233, 0.05)';
              }
            }}
            onMouseOut={(e) => {
              if (currentTheme !== theme.id) {
                e.target.style.background = 'rgba(255, 255, 255, 0.8)';
              }
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', color: '#333' }}>{theme.name}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{theme.description}</div>
            </div>
            {currentTheme === theme.id && (
              <div style={{ 
                color: '#0ea5e9', 
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                ✓
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
