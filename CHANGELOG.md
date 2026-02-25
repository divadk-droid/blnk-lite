# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- API Catalog endpoint (`/api/v1/catalog`) for API discovery
- Swagger UI documentation (`/api-docs`)
- 6 new API endpoints: AI Content, HFT, Alpha, Reports, Creator, Validation
- Jest test suite with coverage reporting
- ESLint and Prettier configuration
- GitHub Actions CI/CD pipeline
- MIT LICENSE file
- Issue and PR templates

### Security
- Removed exposed `.env.alchemy` and `.env.wallet` files from repository
- Added `.gitignore` rules for sensitive files
- Added TruffleHog secret scanning to CI/CD

## [1.0.0] - 2026-02-25

### Added
- Initial release of BLNK Risk Gate
- Pre-trade risk assessment API (`/api/v1/gate`)
- Smart contract risk scoring (0-100)
- Multi-chain support (Ethereum, Base, Arbitrum, Optimism)
- ACP (Agent Commerce Protocol) integration with 19 Job Offerings
- AI Content Risk Scanner module
- HFT Risk API with sub-10ms latency target
- Alpha Feed for whale tracking and anomaly detection
- Portfolio risk dashboard
- Real-time monitoring and alerts
- i18n support (Korean, Chinese, Japanese, English)