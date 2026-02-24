import React, { useState, useEffect } from 'react';

export default function BurnCounter() {
  const [totalBurned, setTotalBurned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch burn statistics from API
    fetchBurnStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchBurnStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBurnStats = async () => {
    try {
      // In production: Fetch from actual API
      // const response = await fetch('/api/stats');
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockBurned = 12500000 + Math.floor(Math.random() * 1000);
      setTotalBurned(mockBurned);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching burn stats:', error);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const percentageBurned = ((totalBurned / 1_000_000_000) * 100).toFixed(4);

  return (
    <div className="bg-cyber-dark rounded-xl p-8 border border-gray-800 glow-green">
      <div className="text-center">
        <p className="text-gray-400 text-sm uppercase tracking-wider mb-4">
          Total $BLNK Burned to Date
        </p>
        
        {isLoading ? (
          <div className="text-6xl font-bold text-cyber-green animate-pulse">
            Loading...
          </div>
        ) : (
          <>
            <div className="text-6xl md:text-8xl font-bold text-cyber-green terminal-text">
              {formatNumber(totalBurned)}
            </div>            
            <div className="mt-4 flex justify-center items-center space-x-4">
              <span className="text-gray-400">
                {percentageBurned}% of total supply
              </span>
              <span className="px-3 py-1 bg-cyber-green/20 text-cyber-green rounded-full text-sm">
                Deflationary 🔥
              </span>
            </div>
          </>
        )}
      </div>

      {/* Burn Progress Bar */}
      <div className="mt-8">
        <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue transition-all duration-1000"
            style={{ width: `${Math.min(parseFloat(percentageBurned) * 10, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>0 BLNK</span>
          <span>100M BLNK</span>
          <span>1B BLNK</span>
        </div>
      </div>
    </div>
  );
}
