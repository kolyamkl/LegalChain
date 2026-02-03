import { VulnerabilityCategory, Severity } from '../models/types';

export interface DetectedVulnerability {
  title: string;
  description: string;
  severity: Severity;
  category: VulnerabilityCategory;
  line_start: number | null;
  line_end: number | null;
  code_snippet: string | null;
  fix_suggestion: string | null;
  education_link: string | null;
}

interface PatternDetector {
  name: string;
  category: VulnerabilityCategory;
  severity: Severity;
  pattern: RegExp;
  description: string;
  fix_suggestion: string;
  education_link?: string;
}

const VULNERABILITY_PATTERNS: PatternDetector[] = [
  {
    name: 'Potential Reentrancy',
    category: 'reentrancy',
    severity: 'critical',
    pattern: /\.call\{value:/i,
    description:
      'External call with value transfer detected. This pattern can be vulnerable to reentrancy attacks if state changes occur after the call.',
    fix_suggestion:
      'Use the checks-effects-interactions pattern: update state before making external calls, or use ReentrancyGuard.',
    education_link: '/education/reentrancy-example',
  },
  {
    name: 'Delegatecall Usage',
    category: 'reentrancy',
    severity: 'high',
    pattern: /delegatecall/i,
    description:
      'Delegatecall allows execution of code in the context of the calling contract. This can be dangerous if the target is untrusted.',
    fix_suggestion:
      'Ensure delegatecall targets are trusted and immutable. Consider using a proxy pattern with proper access controls.',
  },
  {
    name: 'Unchecked External Call',
    category: 'reentrancy',
    severity: 'high',
    pattern: /\.call\(/i,
    description:
      'Low-level call detected. The return value should be checked to handle failures properly.',
    fix_suggestion:
      'Always check the return value of low-level calls: (bool success, ) = target.call(...); require(success);',
  },
  {
    name: 'Centralized Owner Control',
    category: 'access_control',
    severity: 'medium',
    pattern: /onlyOwner|owner\s*==\s*msg\.sender/i,
    description:
      'Contract has owner-only functions. This creates centralization risk if the owner can perform privileged actions.',
    fix_suggestion:
      'Consider using a multi-sig wallet for ownership, implementing timelocks, or decentralizing control through governance.',
    education_link: '/education/access-control-bug',
  },
  {
    name: 'Withdraw All Function',
    category: 'backdoor',
    severity: 'critical',
    pattern: /withdrawAll|withdraw\s*\(\s*\)|emergencyWithdraw/i,
    description:
      'Function that can withdraw all funds detected. This could be used to rug pull if controlled by a single owner.',
    fix_suggestion:
      'Implement withdrawal limits, timelocks, or multi-sig requirements for large withdrawals.',
  },
  {
    name: 'Transfer Ownership',
    category: 'access_control',
    severity: 'medium',
    pattern: /transferOwnership/i,
    description:
      'Ownership can be transferred. Ensure proper access controls and consider a two-step transfer process.',
    fix_suggestion:
      'Use OpenZeppelin Ownable2Step for safer ownership transfers that require acceptance.',
  },
  {
    name: 'Selfdestruct',
    category: 'backdoor',
    severity: 'critical',
    pattern: /selfdestruct|suicide/i,
    description:
      'Contract can be destroyed. This could result in loss of funds and contract functionality.',
    fix_suggestion:
      'Remove selfdestruct if not absolutely necessary. If needed, implement strict access controls and timelocks.',
  },
  {
    name: 'Tx.origin Authentication',
    category: 'access_control',
    severity: 'high',
    pattern: /tx\.origin/i,
    description:
      'Using tx.origin for authentication is vulnerable to phishing attacks where a malicious contract can act on behalf of users.',
    fix_suggestion: 'Use msg.sender instead of tx.origin for authentication.',
  },
  {
    name: 'Hardcoded Address',
    category: 'other',
    severity: 'low',
    pattern: /0x[a-fA-F0-9]{40}/,
    description:
      'Hardcoded address detected. This reduces flexibility and could be problematic if the address needs to change.',
    fix_suggestion:
      'Consider using constructor parameters or setter functions for addresses that might need to change.',
  },
  {
    name: 'Block Timestamp Dependency',
    category: 'other',
    severity: 'low',
    pattern: /block\.timestamp|now/i,
    description:
      'Block timestamp can be manipulated by miners within a small range. Avoid using for critical logic.',
    fix_suggestion:
      'Use block.number for time-sensitive operations or accept the ~15 second manipulation window.',
  },
  {
    name: 'Potential Integer Overflow',
    category: 'overflow',
    severity: 'medium',
    pattern: /\+\+|\+=|--|-=/,
    description:
      'Arithmetic operation detected. In Solidity <0.8.0, these can overflow/underflow without SafeMath.',
    fix_suggestion:
      'Use Solidity 0.8.0+ which has built-in overflow checks, or use SafeMath library.',
    education_link: '/education/integer-overflow-example',
  },
  {
    name: 'Honeypot Pattern - Transfer Restriction',
    category: 'honeypot',
    severity: 'critical',
    pattern: /require\s*\(\s*(?:_)?(?:is)?(?:allowed|whitelist|canSell)/i,
    description:
      'Transfer restriction pattern detected. This could prevent users from selling tokens (honeypot).',
    fix_suggestion:
      'Review the whitelist/restriction logic carefully. Legitimate use cases exist but this is a common scam pattern.',
  },
  {
    name: 'Hidden Fee',
    category: 'fee_misconfig',
    severity: 'high',
    pattern: /(?:_)?(?:tax|fee)(?:Percent|Rate|Amount)?/i,
    description:
      'Fee mechanism detected. Verify the fee percentage is reasonable and cannot be changed to excessive values.',
    fix_suggestion:
      'Implement maximum fee caps and consider making fees immutable or governable.',
  },
  {
    name: 'Proxy/Upgradeable Pattern',
    category: 'upgrade_risk',
    severity: 'medium',
    pattern: /upgradeTo|implementation|proxy/i,
    description:
      'Upgradeable contract pattern detected. The implementation can be changed, which introduces trust assumptions.',
    fix_suggestion:
      'Ensure upgrade mechanisms have proper access controls, timelocks, and consider making critical contracts immutable.',
  },
  {
    name: 'Pause Functionality',
    category: 'access_control',
    severity: 'low',
    pattern: /whenNotPaused|pause\s*\(\)|unpause/i,
    description:
      'Contract can be paused. While useful for emergencies, this gives significant power to the pauser.',
    fix_suggestion:
      'Ensure pause functionality has proper access controls and consider implementing automatic unpause mechanisms.',
  },
  {
    name: 'Blacklist Functionality',
    category: 'honeypot',
    severity: 'high',
    pattern: /blacklist|blocklist|banned|blocked/i,
    description:
      'Blacklist functionality detected. This could be used to prevent specific addresses from transacting.',
    fix_suggestion:
      'Review blacklist implementation carefully. Consider if this functionality is necessary for your use case.',
  },
];

export function analyzeSourceCode(sourceCode: string): DetectedVulnerability[] {
  const vulnerabilities: DetectedVulnerability[] = [];
  const lines = sourceCode.split('\n');

  for (const detector of VULNERABILITY_PATTERNS) {
    let lineNumber = 1;
    for (const line of lines) {
      if (detector.pattern.test(line)) {
        const existingVuln = vulnerabilities.find(
          (v) => v.title === detector.name
        );
        if (!existingVuln) {
          vulnerabilities.push({
            title: detector.name,
            description: detector.description,
            severity: detector.severity,
            category: detector.category,
            line_start: lineNumber,
            line_end: lineNumber,
            code_snippet: line.trim(),
            fix_suggestion: detector.fix_suggestion,
            education_link: detector.education_link || null,
          });
        }
      }
      lineNumber++;
    }
  }

  return vulnerabilities;
}

export function hasOwnerControl(sourceCode: string): boolean {
  const ownerPatterns = [
    /onlyOwner/i,
    /owner\s*==\s*msg\.sender/i,
    /require\s*\(\s*msg\.sender\s*==\s*owner/i,
    /modifier\s+onlyOwner/i,
  ];

  return ownerPatterns.some((pattern) => pattern.test(sourceCode));
}

export function isContractVerified(sourceCode: string | null): boolean {
  return sourceCode !== null && sourceCode.length > 0;
}
