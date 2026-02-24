import React, { useState, useEffect, useRef } from 'react';

interface FeedItem {
  id: string;
  type: 'burn' | 'stake' | 'payment';
  message: string;
  txHash: string;
  timestamp: number;
}

export default function LiveFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial mock data
    const initialFeed: FeedItem[] = [
      {
        id: '1',
        type: 'payment',
        message: 'Nox Agent paid 100 $BLNK. 50 $BLNK burned forever.',
        txHash: '0xabc...123',
        timestamp: Date.now() - 5000,
      },
      {
        id: '2',
        type: 'stake',
        message: 'Ethy AI staked 5,000 $BLNK. Upgraded to PRO.',
        txHash: '0xdef...456',
        timestamp: Date.now() - 15000,
      },
      {
        id: '3',
        type: 'burn',
        message: 'Auto-burn executed: 1,250 $BLNK sent to dead address.',
        txHash: '0xghi...789',
        timestamp: Date.now() - 30000,
      },
    ];
    
    setFeed(initialFeed);

    // Simulate new events every 5-10 seconds
    const interval = setInterval(() => {
      addRandomEvent();
    }, 5000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed]);

  const addRandomEvent = () => {
    const events = [
      { type: 'payment' as const, message: `Agent paid ${Math.floor(Math.random() * 100 + 50)} $BLNK. ${Math.floor(Math.random() * 50 + 25)} $BLNK burned.` },
      { type: 'stake' as const, message: `User staked ${Math.floor(Math.random() * 10000 + 1000)} $BLNK. Upgraded tier.` },
      { type: 'burn' as const, message: `Treasury burn: ${Math.floor(Math.random() * 5000 + 1000)} $BLNK destroyed.` },
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    const newItem: FeedItem = {
      id: Date.now().toString(),
      type: randomEvent.type,
      message: randomEvent.message,
      txHash: `0x${Math.random().toString(16).substr(2, 8)}...`,
      timestamp: Date.now(),
    };

    setFeed(prev => [...prev.slice(-20), newItem]); // Keep last 20 items
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'burn':
        return 'text-cyber-red';
      case 'stake':
        return 'text-cyber-blue';
      case 'payment':
        return 'text-cyber-green';
      default:
        return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'burn':
        return '🔥';
      case 'stake':
        return '🔒';
      case 'payment':
        return '💰';
      default:
        return '•';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-cyber-dark rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-cyber-green flex items-center">
          <span className="mr-2">📡</span>
          Live Feed
        </h2>
        <p className="text-gray-500 text-sm mt-1">Real-time blockchain events</p>
      </div>

      <div className="h-96 overflow-y-auto p-4 font-mono text-sm">
        {feed.length === 0 ? (
          <div className="text-gray-500 text-center py-8">Waiting for events...</div>
        ) : (
          feed.map((item) => (
            <div
              key={item.id}
              className="mb-3 p-3 bg-cyber-black/50 rounded border-l-2 border-gray-700 hover:border-cyber-green transition-colors"
            >
              <div className="flex items-start space-x-2">
                <span className="text-lg">{getTypeIcon(item.type)}</span>
                <div className="flex-1">
                  <div className={`${getTypeColor(item.type)}`}>
                    {item.message}
                  </div>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                    <span>[{formatTime(item.timestamp)}]</span>
                    <a
                      href={`https://basescan.org/tx/${item.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyber-blue hover:underline"
                    >
                      {item.txHash}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={feedEndRef} />
      </div>

      <div className="p-3 border-t border-gray-800 bg-cyber-black/30">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>WebSocket: Connected 🔌</span>
          <span>{feed.length} events</span>
        </div>
      </div>
    </div>
  );
}
