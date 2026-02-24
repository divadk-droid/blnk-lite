import React, { useState, useEffect } from 'react';

interface Stats {
  totalStaked: number;
  totalBurned: number;
  activeStakers: number;
  treasuryBalance: number;
}

export default function Stats() {
  const [stats, setStats] = useState<Stats>({
    totalStaked: 0,
    totalBurned: 0,
    activeStakers: 0,
    treasuryBalance: 0,
  });

  useEffect(() => {
    // Fetch stats from API
    fetchStats();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      // In production: Fetch from actual API
      // const response = await fetch('/api/stats');
      // const data = await response.json();
      
      // Mock data
      setStats({
        totalStaked: 45000000,
        totalBurned: 12500000,
        activeStakers: 1234,
        treasuryBalance: 8750000,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const statCards = [
    {
      label: 'Total Staked',
      value: formatNumber(stats.totalStaked),
      suffix: '$BLNK',
      icon: '🔒',
      color: 'text-cyber-blue',
    },
    {
      label: 'Total Burned',
      value: formatNumber(stats.totalBurned),
      suffix: '$BLNK',
      icon: '🔥',
      color: 'text-cyber-red',
    },
    {
      label: 'Active Stakers',
      value: formatNumber(stats.activeStakers),
      suffix: 'users',
      icon: '👥',
      color: 'text-cyber-green',
    },
    {
      label: 'Treasury',
      value: formatNumber(stats.treasuryBalance),
      suffix: '$BLNK',
      icon: '🏦',
      color: 'text-cyber-purple',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((card) => (
        <div
          key={card.label}
          className="bg-cyber-dark rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">{card.label}</span>
            <span className="text-2xl">{card.icon}</span>
          </div>
          
          <div className={`text-2xl font-bold ${card.color}`}>
            {card.value}
          </div>
          
          <div className="text-xs text-gray-500">{card.suffix}</div>
        </div>
      ))}
    </div>
  );
}
