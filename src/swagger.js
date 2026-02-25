const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BLNK Risk Gate API',
      version: '1.0.0',
      description: 'Web3 Risk Management Gateway - Smart contract risk assessment, AI content verification, and real-time monitoring APIs',
      contact: {
        name: 'BLNK Support',
        url: 'https://discord.gg/blnk',
        email: 'support@blnk.io'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://blnk-lite-production.up.railway.app',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    tags: [
      { name: 'Catalog', description: 'API discovery and documentation' },
      { name: 'Execution', description: 'Pre-trade risk assessment' },
      { name: 'Validation', description: 'Token and contract security' },
      { name: 'AI Content', description: 'AI-generated content detection' },
      { name: 'HFT', description: 'High-frequency trading risk API' },
      { name: 'Portfolio', description: 'Portfolio risk management' },
      { name: 'Alpha', description: 'Institutional-grade intelligence' },
      { name: 'Reports', description: 'Analytics export' },
      { name: 'Creator', description: 'Creator economy reputation' }
    ]
  },
  apis: ['./src/api/routes/*.js', './src/lite-server.js']
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };