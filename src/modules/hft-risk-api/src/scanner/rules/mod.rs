//! OWASP Smart Contract Top 10 Scanning Rules

use crate::models::{RiskFinding, Severity};
use crate::scanner::ScanRule;

// ============================================================================
// Rule 1: Access Control
// ============================================================================
pub struct AccessControlRule;

impl ScanRule for AccessControlRule {
    fn name(&self) -> String {
        "ACCESS_CONTROL".to_string()
    }
    
    fn category(&self) -> String {
        "OWASP-SC01".to_string()
    }
    
    fn check_bytecode(&self,
        _contract_address: &str,
        bytecode: &str,
    ) -> Option<RiskFinding> {
        // Check for common access control patterns in bytecode
        let patterns = vec![
            "owner",
            "onlyOwner",
            "admin",
            "role",
        ];
        
        let has_access_control = patterns.iter().any(|p| {
            bytecode.to_lowercase().contains(p)
        });
        
        if has_access_control {
            Some(RiskFinding {
                category: self.category(),
                severity: Severity::Medium,
                description: "Contract contains access control mechanisms. Verify proper implementation.".to_string(),
                location: None,
                confidence: 0.7,
            })
        } else {
            None
        }
    }
    
    fn check_source(
        &self,
        _contract_address: &str,
        source_code: &str,
    ) -> Option<RiskFinding> {
        // Check for missing access control modifiers
        let dangerous_patterns = vec![
            "function.*selfdestruct",
            "function.*delegatecall",
        ];
        
        for pattern in dangerous_patterns {
            // Simple string matching (regex would be better)
            if source_code.contains("selfdestruct") || source_code.contains("delegatecall") {
                // Check if protected by modifier
                let has_modifier = source_code.contains("onlyOwner") 
                    || source_code.contains("onlyAdmin")
                    || source_code.contains("require(msg.sender == owner)");
                
                if !has_modifier {
                    return Some(RiskFinding {
                        category: self.category(),
                        severity: Severity::High,
                        description: "Dangerous function may lack proper access control".to_string(),
                        location: None,
                        confidence: 0.8,
                    });
                }
            }
        }
        
        None
    }
    
    fn check_transaction(
        &self,
        _contract_address: &str,
        _tx_data: &str,
    ) -> Option<RiskFinding> {
        None // Transaction-level check not applicable
    }
}

// ============================================================================
// Rule 2: Arithmetic Issues
// ============================================================================
pub struct ArithmeticRule;

impl ScanRule for ArithmeticRule {
    fn name(&self) -> String {
        "ARITHMETIC".to_string()
    }
    
    fn category(&self) -> String {
        "OWASP-SC02".to_string()
    }
    
    fn check_bytecode(
        &self,
        _contract_address: &str,
        _bytecode: &str,
    ) -> Option<RiskFinding> {
        // Bytecode-level arithmetic checks would require EVM analysis
        None
    }
    
    fn check_source(
        &self,
        _contract_address: &str,
        source_code: &str,
    ) -> Option<RiskFinding> {
        // Check for unchecked arithmetic
        let unchecked_patterns = vec![
            "unchecked {",
        ];
        
        let pragma_pattern = "pragma solidity";
        
        // Check if using Solidity < 0.8 without SafeMath
        if source_code.contains(pragma_pattern) {
            let uses_old_solidity = source_code.contains("pragma solidity ^0.4.")
                || source_code.contains("pragma solidity ^0.5.")
                || source_code.contains("pragma solidity ^0.6.")
                || source_code.contains("pragma solidity ^0.7.");
            
            let has_safemath = source_code.contains("SafeMath")
                || source_code.contains("using SafeMath");
            
            if uses_old_solidity && !has_safemath {
                return Some(RiskFinding {
                    category: self.category(),
                    severity: Severity::High,
                    description: "Using Solidity < 0.8 without SafeMath - vulnerable to integer overflow/underflow".to_string(),
                    location: None,
                    confidence: 0.9,
                });
            }
        }
        
        // Check for unchecked blocks in Solidity 0.8+
        if unchecked_patterns.iter().any(|p| source_code.contains(p)) {
            return Some(RiskFinding {
                category: self.category(),
                severity: Severity::Medium,
                description: "Unchecked arithmetic block detected - verify safety".to_string(),
                location: None,
                confidence: 0.75,
            });
        }
        
        None
    }
    
    fn check_transaction(
        &self,
        _contract_address: &str,
        _tx_data: &str,
    ) -> Option<RiskFinding> {
        None
    }
}

// ============================================================================
// Rule 3: Delegatecall
// ============================================================================
pub struct DelegatecallRule;

impl ScanRule for DelegatecallRule {
    fn name(&self) -> String {
        "DELEGATECALL".to_string()
    }
    
    fn category(&self) -> String {
        "OWASP-SC03".to_string()
    }
    
    fn check_bytecode(
        &self,
        _contract_address: &str,
        bytecode: &str,
    ) -> Option<RiskFinding> {
        // DELEGATECALL opcode: 0xF4
        if bytecode.contains("f4") {
            Some(RiskFinding {
                category: self.category(),
                severity: Severity::High,
                description: "Contract uses DELEGATECALL - verify implementation for proxy pattern safety".to_string(),
                location: None,
                confidence: 0.85,
            })
        } else {
            None
        }
    }
    
    fn check_source(
        &self,
        _contract_address: &str,
        source_code: &str,
    ) -> Option<RiskFinding> {
        if source_code.contains("delegatecall") {
            Some(RiskFinding {
                category: self.category(),
                severity: Severity::High,
                description: "DELEGATECALL usage detected - ensure proper access control".to_string(),
                location: None,
                confidence: 0.9,
            })
        } else {
            None
        }
    }
    
    fn check_transaction(
        &self,
        _contract_address: &str,
        _tx_data: &str,
    ) -> Option<RiskFinding> {
        None
    }
}

// ============================================================================
// Rule 4: Oracle Manipulation
// ============================================================================
pub struct OracleManipulationRule;

impl ScanRule for OracleManipulationRule {
    fn name(&self) -> String {
        "ORACLE_MANIPULATION".to_string()
    }
    
    fn category(&self) -> String {
        "OWASP-SC04".to_string()
    }
    
    fn check_bytecode(
        &self,
        _contract_address: &str,
        _bytecode: &str,
    ) -> Option<RiskFinding> {
        None
    }
    
    fn check_source(
        &self,
        _contract_address: &str,
        source_code: &str,
    ) -> Option<RiskFinding> {
        let oracle_patterns = vec![
            "Chainlink",
            "UniswapV2Oracle",
            "getReserves",
            "latestRoundData",
            "price()",
        ];
        
        let has_oracle = oracle_patterns.iter().any(|p| source_code.contains(p));
        
        if has_oracle {
            Some(RiskFinding {
                category: self.category(),
                severity: Severity::Medium,
                description: "Oracle usage detected - verify manipulation safeguards".to_string(),
                location: None,
                confidence: 0.7,
            })
        } else {
            None
        }
    }
    
    fn check_transaction(
        &self,
        _contract_address: &str,
        _tx_data: &str,
    ) -> Option<RiskFinding> {
        None
    }
}

// ============================================================================
// Rule 5: Reentrancy
// ============================================================================
pub struct ReentrancyRule;

impl ScanRule for ReentrancyRule {
    fn name(&self) -> String {
        "REENTRANCY".to_string()
    }
    
    fn category(&self) -> String {
        "OWASP-SC05".to_string()
    }
    
    fn check_bytecode(
        &self,
        _contract_address: &str,
        _bytecode: &str,
    ) -> Option<RiskFinding> {
        None
    }
    
    fn check_source(
        &self,
        _contract_address: &str,
        source_code: &str,
    ) -> Option<RiskFinding> {
        // Check for external calls before state changes
        let external_call_patterns = vec![
            ".call{value:",
            ".transfer(",
            ".send(",
        ];
        
        let has_external_call = external_call_patterns.iter().any(|p| source_code.contains(p));
        
        // Check for reentrancy guard
        let has_guard = source_code.contains("nonReentrant")
            || source_code.contains("ReentrancyGuard");
        
        // Check for checks-effects-interactions pattern
        let has_cei_pattern = source_code.contains("_balances[msg.sender] = 0")
            || source_code.contains("balances[msg.sender] -=");
        
        if has_external_call && !has_guard && !has_cei_pattern {
            return Some(RiskFinding {
                category: self.category(),
                severity: Severity::Critical,
                description: "Potential reentrancy vulnerability - external call without guard".to_string(),
                location: None,
                confidence: 0.8,
            });
        }
        
        None
    }
    
    fn check_transaction(&self, _contract_address: &str, _tx_data: &str) -> Option<RiskFinding> {
        None
    }
}

// ============================================================================
// Rule 6: Unchecked Calls
// ============================================================================
pub struct UncheckedCallRule;

impl ScanRule for UncheckedCallRule {
    fn name(&self) -> String {
        "UNCHECKED_CALL".to_string()
    }
    
    fn category(&self) -> String {
        "OWASP-SC06".to_string()
    }
    
    fn check_bytecode(&self, _contract_address: &str, _bytecode: &str) -> Option<RiskFinding> {
        None
    }
    
    fn check_source(&self, _contract_address: &str, source_code: &str) -> Option<RiskFinding> {
        // Check for low-level calls without success check
        if source_code.contains(".call(") || source_code.contains(".delegatecall(") {
            // This is a simplified check - real implementation would parse AST
            if !source_code.contains("require(success") && !source_code.contains("if (!success") {
                return Some(RiskFinding {
                    category: self.category(),
                    severity: Severity::Medium,
                    description: "Low-level call may not check return value".to_string(),
                    location: None,
                    confidence: 0.6,
                });
            }
        }
        
        None
    }
    
    fn check_transaction(&self, _contract_address: &str, _tx_data: &str) -> Option<RiskFinding> {
        None
    }
}

// ============================================================================
// Rule 7: Timestamp Dependence
// ============================================================================
pub struct TimestampDependenceRule;

impl ScanRule for TimestampDependenceRule {
    fn name(&self) -> String {
        "TIMESTAMP_DEPENDENCE".to_string()
    }
    
    fn category(&self) -> String {
        "OWASP-SC07".to_string()
    }
    
    fn check_bytecode(&self, _contract_address: &str, _bytecode: &str) -> Option<RiskFinding> {
        None
    }
    
    fn check_source(&self, _contract_address: &str, source_code: &str) -> Option<RiskFinding> {
        let timestamp_patterns = vec![
            "block.timestamp",
            "now",
        ];
        
        let has_timestamp = timestamp_patterns.iter().any(|p| source_code.contains(p));
        
        // Check if used in critical logic
        let critical_usage = source_code.contains("block.timestamp") 
            && (source_code.contains("random") || source_code.contains("lottery"));
        
        if critical_usage {
            return Some(RiskFinding {
                category: self.category(),
                severity: Severity::High,
                description: "block.timestamp used in critical logic - miners can manipulate".to_string(),
                location: None,
                confidence: 0.85,
            });
        }
        
        if has_timestamp {
            return Some(RiskFinding {
                category: self.category(),
                severity: Severity::Low,
                description: "block.timestamp usage detected - verify not used for randomness".to_string(),
                location: None,
                confidence: 0.5,
            });
        }
        
        None
    }
    
    fn check_transaction(&self, _contract_address: &str, _tx_data: &str) -> Option<RiskFinding> {
        None
    }
}

// ============================================================================
// Rule 8: tx.origin Usage
// ============================================================================
pub struct TxOriginRule;

impl ScanRule for TxOriginRule {
    fn name(&self) -> String {
        "TX_ORIGIN".to_string()
    }
    
    fn category(&self) -> String {
        "OWASP-SC08".to_string()
    }
    
    fn check_bytecode(&self, _contract_address: &str, _bytecode: &str) -> Option<RiskFinding> {
        None
    }
    
    fn check_source(&self, _contract_address: &str, source_code: &str) -> Option<RiskFinding> {
        if source_code.contains("tx.origin") {
            // Check if used for authorization
            if source_code.contains("tx.origin == owner") || source_code.contains("require(tx.origin") {
                return Some(RiskFinding {
                    category: self.category(),
                    severity: Severity::Critical,
                    description: "tx.origin used for authorization - vulnerable to phishing attacks".to_string(),
                    location: None,
                    confidence: 0.95,
                });
            }
            
            return Some(RiskFinding {
                category: self.category(),
                severity: Severity::Medium,
                description: "tx.origin usage detected - prefer msg.sender".to_string(),
                location: None,
                confidence: 0.8,
            });
        }
        
        None
    }
    
    fn check_transaction(&self, _contract_address: &str, _tx_data: &str) -> Option<RiskFinding> {
        None
    }
}

// ============================================================================
// Rule 9: Flash Loan Attacks
// ============================================================================
pub struct FlashLoanRule;

impl ScanRule for FlashLoanRule {
    fn name(&self) -> String {
        "FLASH_LOAN".to_string()
    }
    
    fn category(&self) -> String {
        "OWASP-SC09".to_string()
    }
    
    fn check_bytecode(&self, _contract_address: &str, _bytecode: &str) -> Option<RiskFinding> {
        None
    }
    
    fn check_source(&self, _contract_address: &str, source_code: &str) -> Option<RiskFinding> {
        let flash_loan_patterns = vec![
            "flashLoan",
            "FlashLoan",
            "flash loan",
            "Aave",
            "Balancer",
            "UniswapV2Pair",
            "swap",
        ];
        
        let has_flash_loan = flash_loan_patterns.iter().any(|p| source_code.contains(p));
        
        if has_flash_loan {
            return Some(RiskFinding {
                category: self.category(),
                severity: Severity::Medium,
                description: "Flash loan related code detected - verify price manipulation safeguards".to_string(),
                location: None,
                confidence: 0.6,
            });
        }
        
        None
    }
    
    fn check_transaction(&self, _contract_address: &str, _tx_data: &str) -> Option<RiskFinding> {
        None
    }
}

// ============================================================================
// Rule 10: Input Validation
// ============================================================================
pub struct InputValidationRule;

impl ScanRule for InputValidationRule {
    fn name(&self) -> String {
        "INPUT_VALIDATION".to_string()
    }
    
    fn category(&self) -> String {
        "OWASP-SC10".to_string()
    }
    
    fn check_bytecode(&self, _contract_address: &str, _bytecode: &str) -> Option<RiskFinding> {
        None
    }
    
    fn check_source(&self, _contract_address: &str, source_code: &str) -> Option<RiskFinding> {
        // Check for external function parameters without validation
        // This is a simplified heuristic
        
        let has_require = source_code.contains("require(");
        let has_assert = source_code.contains("assert(");
        let has_custom_error = source_code.contains("error ");
        
        if !has_require && !has_assert && !has_custom_error {
            return Some(RiskFinding {
                category: self.category(),
                severity: Severity::Medium,
                description: "Limited input validation detected - consider adding require statements".to_string(),
                location: None,
                confidence: 0.5,
            });
        }
        
        None
    }
    
    fn check_transaction(&self, _contract_address: &str, _tx_data: &str) -> Option<RiskFinding> {
        None
    }
}
