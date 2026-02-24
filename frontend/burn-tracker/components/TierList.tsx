import React from 'react';

interface Tier {
  name: string;
  minStake: number;
  dailyLimit: number;
  features: string[];
  color: string;
}

const tiers: Tier[] = [
  {
    name: 'FREE',
    minStake: 0,
    dailyLimit: 5,
    features: ['Basic gate access', 'Public RPC', 'Community support'],
    color: 'text-gray-400',
  },
  {
    name: 'BASIC',
    minStake: 500,
    dailyLimit: 500,
    features: ['Priority queue', '5min cache', 'Email support'],
    color: 'text-cyber-blue',
  },
  {
    name: 'PRO',
    minStake: 5000,
    dailyLimit: 2000,
    features: ['Fast lane', 'Policy pack', 'Webhook alerts', 'Discord support'],
    color: 'text-cyber-purple',
  },
  {
    name: 'ENTERPRISE',
    minStake: 50000,
    dailyLimit: 10000,
    features: ['Dedicated RPC', 'Custom policies', 'Alpha access', 'SLA guarantee'],
    color: 'text-cyber-green',
  },
];

export default function TierList() {
  return (
    <div className="bg-cyber-dark rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-cyber-green flex items-center">
          <span className="mr-2">🏆</span>
          Staking Tiers
        </h2>
        <p className="text-gray-500 text-sm mt-1">Stake $BLNK to unlock benefits</p>
      </div>

      <div className="p-4 space-y-4">
        {tiers.map((tier, index) => (
          <div
            key={tier.name}
            className={`relative p-4 rounded-lg border transition-all hover:border-cyber-green ${
              index === tiers.length - 1
                ? 'bg-cyber-green/10 border-cyber-green'
                : 'bg-cyber-black/50 border-gray-700'
            }`}
          >
            {/* Popular badge for Enterprise */}
            {index === tiers.length - 1 && (
              <div className="absolute -top-3 right-4 px-3 py-1 bg-cyber-green text-cyber-black text-xs font-bold rounded-full">
                BEST VALUE
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <div className={`text-2xl font-bold ${tier.color}`}>
                {tier.name}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {tier.minStake.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">$BLNK staked</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Daily API Calls:</span>
                <span className="text-cyber-blue font-bold">
                  {tier.dailyLimit.toLocaleString()}
                </span>
              </div>
            </div>

            <ul className="space-y-2">
              {tier.features.map((feature, i) => (
                <li key={i} className="flex items-center text-sm text-gray-300">
                  <svg
                    className="w-4 h-4 mr-2 text-cyber-green flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800 bg-cyber-black/30">
        <p className="text-xs text-gray-500 text-center">
          💡 Stake more $BLNK to unlock higher tiers and exclusive features
        </p>
      </div>
    </div>
  );
}
