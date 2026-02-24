import React from 'react';
import Head from 'next/head';
import BurnCounter from '../components/BurnCounter';
import LiveFeed from '../components/LiveFeed';
import TierList from '../components/TierList';
import Stats from '../components/Stats';

export default function Home() {
  return (
    <div className="min-h-screen bg-cyber-black grid-bg">
      <Head>
        <title>BLNK Burn Tracker | A2A Security Agent</title>
        <meta name="description" content="Track BLNK token burns and staking tiers" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-cyber-green mb-4 terminal-text">
            BLNK BURN TRACKER
          </h1>
          <p className="text-gray-400 text-lg">
            Real-time transparency for the A2A Security Agent ecosystem
          </p>
        </header>

        {/* Hero Section - Burn Counter */}
        <section className="mb-12">
          <BurnCounter />
        </section>

        {/* Stats Grid */}
        <section className="mb-12">
          <Stats />
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Feed */}
          <section>
            <LiveFeed />
          </section>

          {/* Tier List */}
          <section>
            <TierList />
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>BLNK Risk Gate © 2026 | Base Network</p>
          <div className="mt-4 space-x-4">
            <a href="https://docs.blnk.io" className="text-cyber-blue hover:underline">Documentation</a>
            <a href="https://github.com/blnk" className="text-cyber-blue hover:underline">GitHub</a>
            <a href="https://discord.gg/blnk" className="text-cyber-blue hover:underline">Discord</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
