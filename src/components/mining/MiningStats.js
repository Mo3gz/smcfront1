import React from 'react';
import { Row, Col, Statistic, Card, Tooltip } from 'antd';
import { 
  DollarOutlined, 
  ClockCircleOutlined, 
  PieChartOutlined,
  WalletOutlined
} from '@ant-design/icons';

const formatTime = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  return date.toLocaleString();
};

const formatDuration = (seconds) => {
  if (!seconds) return '--';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const MiningStats = ({ stats }) => {
  if (!stats) return null;
  
  const sessionDuration = stats.lastActive 
    ? (new Date(stats.lastActive) - new Date(stats.startTime)) / 1000 
    : 0;
  
  const estimatedEarnings = (stats.estimatedHourlyRate * (sessionDuration / 3600)).toFixed(6);
  
  return (
    <div className="mining-stats">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Tooltip title="Total coins mined in this session">
            <Card className="stat-card">
              <Statistic
                title="Total Mined"
                value={stats.totalMined.toFixed(6)}
                prefix={<DollarOutlined />}
                precision={6}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Tooltip>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Tooltip title="Estimated coins earned in this session">
            <Card className="stat-card">
              <Statistic
                title="Session Earnings"
                value={estimatedEarnings}
                prefix={<WalletOutlined />}
                precision={6}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Tooltip>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Tooltip title="Total time spent mining in this session">
            <Card className="stat-card">
              <Statistic
                title="Mining Duration"
                value={formatDuration(sessionDuration)}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Tooltip>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Tooltip title="Current mining rate per hour">
            <Card className="stat-card">
              <Statistic
                title="Mining Rate"
                value={stats.estimatedHourlyRate.toFixed(6)}
                prefix={<PieChartOutlined />}
                precision={6}
                suffix="coins/hour"
              />
            </Card>
          </Tooltip>
        </Col>
      </Row>
      
      <div className="mining-session-info">
        <Row gutter={[16, 16]}>
          <Col span={24} md={12}>
            <Card size="small" className="info-card">
              <div className="info-item">
                <span className="info-label">Session Started:</span>
                <span className="info-value">{formatTime(stats.startTime)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Active:</span>
                <span className="info-value">
                  {formatTime(stats.lastActive)} 
                  {stats.lastActive && (
                    <span className="time-ago">
                      ({Math.round((new Date() - new Date(stats.lastActive)) / 60000)} min ago)
                    </span>
                  )}
                </span>
              </div>
            </Card>
          </Col>
          
          <Col span={24} md={12}>
            <Card size="small" className="info-card">
              <div className="info-item">
                <span className="info-label">Estimated Daily:</span>
                <span className="info-value">
                  {(stats.estimatedHourlyRate * 24).toFixed(6)} coins
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Estimated Weekly:</span>
                <span className="info-value">
                  {(stats.estimatedHourlyRate * 24 * 7).toFixed(6)} coins
                </span>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default MiningStats;
