import React, { useState, useEffect } from 'react';
import { Modal, List, Input, Button, Empty, Card, Tag } from 'antd';
import { SearchOutlined, CheckOutlined } from '@ant-design/icons';
import './MiningStyles.css';

const { Search } = Input;

const CountrySelector = ({ visible, countries, onSelect, onCancel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [recentCountries, setRecentCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);

  useEffect(() => {
    if (visible) {
      // Load recent countries from localStorage
      const recent = JSON.parse(localStorage.getItem('recentCountries') || '[]');
      setRecentCountries(recent);
      
      // Filter countries based on search term
      if (searchTerm.trim() === '') {
        setFilteredCountries(countries);
      } else {
        const filtered = countries.filter(country => 
          country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          country.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCountries(filtered);
      }
    }
  }, [visible, searchTerm, countries]);

  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    
    // Update recent countries
    const recent = [
      country,
      ...recentCountries.filter(c => c._id !== country._id)
    ].slice(0, 5); // Keep only 5 most recent
    
    setRecentCountries(recent);
    localStorage.setItem('recentCountries', JSON.stringify(recent));
  };

  const handleConfirmSelection = () => {
    if (selectedCountry) {
      onSelect(selectedCountry._id);
      onCancel();
    }
  };

  const renderCountryItem = (country, isRecent = false) => (
    <List.Item 
      key={country._id}
      className={`country-item ${selectedCountry?._id === country._id ? 'selected' : ''}`}
      onClick={() => handleSelectCountry(country)}
    >
      <div className="country-flag">
        <span className={`flag-icon flag-icon-${country.code.toLowerCase()}`}></span>
      </div>
      <div className="country-info">
        <div className="country-name">{country.name}</div>
        <div className="country-rate">
          <Tag color="blue">{country.miningRate.toFixed(6)} coins/hour</Tag>
          {isRecent && <Tag color="gold">Recent</Tag>}
        </div>
      </div>
      {selectedCountry?._id === country._id && (
        <div className="country-selected">
          <CheckOutlined />
        </div>
      )}
    </List.Item>
  );

  return (
    <Modal
      title="Select Mining Country"
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="confirm" 
          type="primary" 
          onClick={handleConfirmSelection}
          disabled={!selectedCountry}
        >
          Start Mining
        </Button>,
      ]}
      width={600}
      className="country-selector-modal"
    >
      <div className="country-selector">
        <Search
          placeholder="Search countries..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="large"
          autoFocus
        />

        {recentCountries.length > 0 && searchTerm === '' && (
          <Card 
            title="Recent Countries" 
            size="small"
            className="recent-countries"
          >
            <List
              dataSource={recentCountries}
              renderItem={(country) => renderCountryItem(country, true)}
              locale={{
                emptyText: 'No recent countries'
              }}
            />
          </Card>
        )}

        <Card 
          title={searchTerm ? 'Search Results' : 'All Countries'}
          size="small"
          className="all-countries"
        >
          <List
            dataSource={filteredCountries}
            renderItem={(country) => renderCountryItem(country)}
            locale={{
              emptyText: 'No countries found'
            }}
            pagination={{
              pageSize: 5,
              size: 'small',
              hideOnSinglePage: true,
              showSizeChanger: false
            }}
          />
        </Card>
      </div>
    </Modal>
  );
};

export default CountrySelector;
