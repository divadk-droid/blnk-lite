//! OWASP Smart Contract Security Scanner
//! 
//! Implements real-time scanning based on OWASP Smart Contract Top 10:
//! 1. Access Control
//! 2. Arithmetic Issues (Integer Overflow/Underflow)
//! 3. Delegatecall
//! 4. Oracle Manipulation
//! 5. Reentrancy
//! 6. Unchecked Calls
//! 7. Timestamp Dependence
//! 8. tx.origin Usage
//! 9. Flash Loan Attacks
//! 10. Input Validation

use std::collections::HashMap;
use std::sync::Arc;

use crate::models::{RiskFinding, Severity};

pub mod rules;

use rules::*;

/// OWASP Scanner configuration
#[derive(Debug, Clone)]
pub struct ScannerConfig {
    /// Enable all rules by default
    pub enable_all: bool,
    /// Specific rules to enable
    pub enabled_rules: Vec<String>,
    /// Rules to disable
    pub disabled_rules: Vec<String>,
    /// Timeout for scanning (milliseconds)
    pub timeout_ms: u64,
}

impl Default for ScannerConfig {
    fn default() -> Self {
        Self {
            enable_all: true,
            enabled_rules: vec![],
            disabled_rules: vec![],
            timeout_ms: 3000, // 3 seconds max
        }
    }
}

/// OWASP Smart Contract Scanner
pub struct OwaspScanner {
    config: ScannerConfig,
    rules: Vec<Box<dyn ScanRule + Send + Sync>>,
}

impl OwaspScanner {
    /// Create a new scanner with default configuration
    pub fn new() -> Self {
        let config = ScannerConfig::default();
        let rules = Self::init_rules(&config);
        
        Self { config, rules }
    }
    
    /// Create scanner with custom configuration
    pub fn with_config(config: ScannerConfig) -> Self {
        let rules = Self::init_rules(&config);
        Self { config, rules }
    }
    
    /// Initialize all OWASP scanning rules
    fn init_rules(config: &ScannerConfig) -> Vec<Box<dyn ScanRule + Send + Sync>> {
        let mut rules: Vec<Box<dyn ScanRule + Send + Sync>> = vec![
            Box::new(AccessControlRule),
            Box::new(ArithmeticRule),
            Box::new(DelegatecallRule),
            Box::new(OracleManipulationRule),
            Box::new(ReentrancyRule),
            Box::new(UncheckedCallRule),
            Box::new(TimestampDependenceRule),
            Box::new(TxOriginRule),
            Box::new(FlashLoanRule),
            Box::new(InputValidationRule),
        ];
        
        // Filter rules based on configuration
        if !config.enable_all {
            rules.retain(|rule| config.enabled_rules.contains(&rule.name()));
        }
        
        rules.retain(|rule| !config.disabled_rules.contains(&rule.name()));
        
        rules
    }
    
    /// Scan contract bytecode for vulnerabilities
    pub fn scan_bytecode(&self,
        contract_address: &str,
        bytecode: &str,
    ) -> Vec<RiskFinding> {
        let mut findings = Vec::new();
        
        for rule in &self.rules {
            if let Some(finding) = rule.check_bytecode(contract_address, bytecode) {
                findings.push(finding);
            }
        }
        
        findings
    }
    
    /// Scan contract source code for vulnerabilities
    pub fn scan_source(&self,
        contract_address: &str,
        source_code: &str,
    ) -> Vec<RiskFinding> {
        let mut findings = Vec::new();
        
        for rule in &self.rules {
            if let Some(finding) = rule.check_source(contract_address, source_code) {
                findings.push(finding);
            }
        }
        
        findings
    }
    
    /// Scan transaction data for risks
    pub fn scan_transaction(
        &self,
        contract_address: &str,
        tx_data: &str,
    ) -> Vec<RiskFinding> {
        let mut findings = Vec::new();
        
        for rule in &self.rules {
            if let Some(finding) = rule.check_transaction(contract_address, tx_data) {
                findings.push(finding);
            }
        }
        
        findings
    }
    
    /// Get list of available rules
    pub fn available_rules(&self) -> Vec<String> {
        self.rules.iter().map(|r| r.name()).collect()
    }
}

impl Default for OwaspScanner {
    fn default() -> Self {
        Self::new()
    }
}

/// Trait for individual scanning rules
pub trait ScanRule {
    /// Rule name
    fn name(&self) -> String;
    
    /// OWASP category
    fn category(&self) -> String;
    
    /// Check bytecode for vulnerability
    fn check_bytecode(
        &self,
        contract_address: &str,
        bytecode: &str,
    ) -> Option<RiskFinding>;
    
    /// Check source code for vulnerability
    fn check_source(
        &self,
        contract_address: &str,
        source_code: &str,
    ) -> Option<RiskFinding>;
    
    /// Check transaction data for risks
    fn check_transaction(
        &self,
        contract_address: &str,
        tx_data: &str,
    ) -> Option<RiskFinding>;
}
