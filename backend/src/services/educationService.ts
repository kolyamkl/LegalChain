import { EducationPattern, EducationPatternSummary } from '../models/types';

const EDUCATION_PATTERNS: EducationPattern[] = [
  {
    id: '1',
    slug: 'reentrancy-example',
    title: 'Reentrancy Vulnerability Example',
    category: 'reentrancy',
    vulnerable_code: `// VULNERABLE CODE - DO NOT USE
pragma solidity ^0.8.0;

contract VulnerableBank {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // VULNERABILITY: External call before state update
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        // State update happens AFTER the external call
        balances[msg.sender] -= amount;
    }
}`,
    fixed_code: `// FIXED CODE - Safe Implementation
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SafeBank is ReentrancyGuard {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // State update BEFORE external call (Checks-Effects-Interactions)
        balances[msg.sender] -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}`,
    explanation: `## Reentrancy Attack Explained

A reentrancy attack occurs when an external contract call allows the called contract to make recursive calls back to the original function before the first execution is complete.

### How the Attack Works:
1. Attacker deploys a malicious contract with a fallback/receive function
2. Attacker calls withdraw() on the vulnerable contract
3. The vulnerable contract sends ETH to the attacker
4. Attacker's receive() function is triggered
5. Attacker's receive() calls withdraw() again
6. Since balance hasn't been updated yet, the check passes
7. This repeats until the contract is drained

### The Fix:
Use the **Checks-Effects-Interactions** pattern:
1. **Checks**: Validate all conditions first
2. **Effects**: Update state variables
3. **Interactions**: Make external calls last

Additionally, use OpenZeppelin's ReentrancyGuard for extra protection.

### Real-World Example:
The DAO hack in 2016 exploited this exact vulnerability, resulting in the loss of ~$60 million worth of ETH.`,
    quiz_question: 'What is the main cause of reentrancy vulnerabilities?',
    quiz_options: [
      'Using too much gas',
      'External calls made before state updates',
      'Not using the latest Solidity version',
      'Having too many functions in a contract',
    ],
    quiz_correct_index: 1,
  },
  {
    id: '2',
    slug: 'access-control-bug',
    title: 'Access Control Bug Example',
    category: 'access_control',
    vulnerable_code: `// VULNERABLE CODE - DO NOT USE
pragma solidity ^0.8.0;

contract VulnerableVault {
    address public owner;
    mapping(address => uint256) public balances;

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // VULNERABILITY: No access control!
    function withdrawAll() external {
        payable(msg.sender).transfer(address(this).balance);
    }

    // VULNERABILITY: Anyone can change owner!
    function setOwner(address newOwner) external {
        owner = newOwner;
    }
}`,
    fixed_code: `// FIXED CODE - Safe Implementation
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SafeVault is Ownable {
    mapping(address => uint256) public balances;

    constructor() Ownable(msg.sender) {}

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // Only owner can withdraw all funds
    function withdrawAll() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Ownership transfer is handled by Ownable with proper checks
    // transferOwnership() requires new owner to accept
}`,
    explanation: `## Access Control Vulnerabilities

Access control bugs occur when functions that should be restricted can be called by anyone.

### Common Mistakes:
1. **Missing modifiers**: Forgetting to add onlyOwner or similar checks
2. **Incorrect checks**: Using wrong comparison operators
3. **tx.origin usage**: Using tx.origin instead of msg.sender for auth

### Impact:
- Unauthorized fund withdrawals
- Contract takeover
- State manipulation
- Complete loss of funds

### Best Practices:
1. Use OpenZeppelin's Access Control contracts
2. Apply principle of least privilege
3. Use multi-sig for critical operations
4. Implement timelocks for sensitive changes
5. Always test access control in your test suite`,
    quiz_question: 'Which is the safest way to implement access control?',
    quiz_options: [
      'Check if tx.origin equals owner',
      'Use OpenZeppelin Access Control contracts',
      'Trust that users will not call restricted functions',
      'Make all functions internal',
    ],
    quiz_correct_index: 1,
  },
  {
    id: '3',
    slug: 'integer-overflow-example',
    title: 'Integer Overflow Example',
    category: 'overflow',
    vulnerable_code: `// VULNERABLE CODE - Solidity < 0.8.0
pragma solidity ^0.7.0;

contract VulnerableToken {
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) external {
        // VULNERABILITY: No overflow check in older Solidity
        // If balances[msg.sender] = 100 and amount = 101
        // Result would be a huge number due to underflow!
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
    
    function batchMint(address[] calldata recipients, uint256 amount) external {
        // VULNERABILITY: Overflow in multiplication
        // If recipients.length * amount > type(uint256).max
        // totalMinted would wrap around to a small number
        uint256 totalMinted = recipients.length * amount;
        
        for (uint i = 0; i < recipients.length; i++) {
            balances[recipients[i]] += amount;
        }
    }
}`,
    fixed_code: `// FIXED CODE - Solidity >= 0.8.0 has built-in checks
pragma solidity ^0.8.0;

contract SafeToken {
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) external {
        // Solidity 0.8+ automatically reverts on overflow/underflow
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
    
    function batchMint(address[] calldata recipients, uint256 amount) external {
        // Still good practice to add explicit checks for clarity
        require(recipients.length > 0, "Empty recipients");
        require(amount > 0, "Zero amount");
        
        // Safe in 0.8+, would revert if overflow occurs
        uint256 totalMinted = recipients.length * amount;
        
        for (uint i = 0; i < recipients.length; i++) {
            balances[recipients[i]] += amount;
        }
    }
}`,
    explanation: `## Integer Overflow/Underflow

In Solidity versions before 0.8.0, arithmetic operations could silently overflow or underflow without reverting.

### What Happens:
- **Overflow**: When a number exceeds its maximum value, it wraps to 0
  - Example: uint8(255) + 1 = 0
- **Underflow**: When subtracting from 0, it wraps to max value
  - Example: uint8(0) - 1 = 255

### Historical Impact:
The BEC token hack in 2018 exploited an integer overflow, allowing attackers to generate tokens out of thin air.

### Solutions:
1. **Use Solidity 0.8.0+**: Built-in overflow/underflow checks
2. **SafeMath library**: For older versions, use OpenZeppelin's SafeMath
3. **Explicit checks**: Add require statements for critical operations

### Note:
In Solidity 0.8+, you can use \`unchecked { }\` blocks to disable checks when you're certain overflow won't occur (saves gas).`,
    quiz_question: 'What happens in Solidity 0.7.0 when uint8(255) + 1 is calculated?',
    quiz_options: [
      'The transaction reverts',
      'The result is 256',
      'The result is 0 (overflow)',
      'A compiler error occurs',
    ],
    quiz_correct_index: 2,
  },
  {
    id: '4',
    slug: 'honeypot-token',
    title: 'Honeypot Token (Scam Pattern)',
    category: 'honeypot',
    vulnerable_code: `// SCAM CODE - Honeypot Token
pragma solidity ^0.8.0;

contract HoneypotToken {
    mapping(address => uint256) public balances;
    mapping(address => bool) private _canSell;
    address public owner;
    
    constructor() {
        owner = msg.sender;
        _canSell[msg.sender] = true;
    }
    
    function buy() external payable {
        balances[msg.sender] += msg.value * 1000;
        // Note: buyer is NOT added to _canSell
    }
    
    function sell(uint256 amount) external {
        // HONEYPOT: Only whitelisted addresses can sell!
        require(_canSell[msg.sender], "Not allowed");
        require(balances[msg.sender] >= amount, "Insufficient");
        
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount / 1000);
    }
    
    // Hidden function to whitelist (only owner knows about it)
    function _a1b2c3(address addr) external {
        require(msg.sender == owner);
        _canSell[addr] = true;
    }
}`,
    fixed_code: `// LEGITIMATE TOKEN - No Hidden Restrictions
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LegitimateToken is ERC20 {
    constructor() ERC20("Legitimate Token", "LEGIT") {
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    // Standard ERC20 - anyone can transfer/sell
    // No hidden whitelists or restrictions
    // All functions are transparent and documented
}`,
    explanation: `## Honeypot Scam Pattern

A honeypot is a scam contract designed to trap users' funds by allowing deposits but preventing withdrawals.

### How Honeypots Work:
1. Scammer deploys a token that looks legitimate
2. Users can buy the token normally
3. When users try to sell, the transaction fails
4. Only the scammer (whitelisted) can sell

### Red Flags to Watch For:
- Hidden mappings controlling transfers
- Obfuscated function names (like _a1b2c3)
- Whitelist/blacklist mechanisms
- Complex transfer logic
- Unverified source code
- Very new contracts with no history

### How to Protect Yourself:
1. **Check if source is verified** on block explorer
2. **Read the code** or use analysis tools
3. **Test with small amounts** first
4. **Check transaction history** - can others sell?
5. **Use LegalChain** to scan before interacting!`,
    quiz_question: 'What is the main characteristic of a honeypot token?',
    quiz_options: [
      'It has very high gas fees',
      'Users can buy but cannot sell',
      'It uses an old Solidity version',
      'It has too many holders',
    ],
    quiz_correct_index: 1,
  },
  {
    id: '5',
    slug: 'simple-erc20-token',
    title: 'Simple ERC-20 Token',
    category: 'token_standard',
    vulnerable_code: `// BASIC ERC-20 (Missing some best practices)
pragma solidity ^0.8.0;

contract BasicToken {
    string public name = "Basic Token";
    string public symbol = "BASIC";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply * 10**decimals;
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}`,
    fixed_code: `// RECOMMENDED ERC-20 Implementation
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SafeToken is ERC20, ERC20Burnable, Ownable {
    constructor(uint256 initialSupply) 
        ERC20("Safe Token", "SAFE") 
        Ownable(msg.sender) 
    {
        _mint(msg.sender, initialSupply * 10**decimals());
    }
    
    // Optional: Allow owner to mint more tokens
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}`,
    explanation: `## ERC-20 Token Standard

ERC-20 is the most common token standard on Ethereum, defining a common interface for fungible tokens.

### Required Functions:
- \`totalSupply()\` - Total token supply
- \`balanceOf(address)\` - Balance of an account
- \`transfer(address, uint256)\` - Transfer tokens
- \`approve(address, uint256)\` - Approve spending
- \`allowance(address, address)\` - Check allowance
- \`transferFrom(address, address, uint256)\` - Transfer from allowance

### Required Events:
- \`Transfer(address indexed from, address indexed to, uint256 value)\`
- \`Approval(address indexed owner, address indexed spender, uint256 value)\`

### Best Practices:
1. Use OpenZeppelin's battle-tested implementation
2. Emit events for all state changes
3. Add input validation
4. Consider adding pausable functionality
5. Implement proper access control for admin functions`,
    quiz_question: 'Which is NOT a required function in the ERC-20 standard?',
    quiz_options: [
      'transfer()',
      'balanceOf()',
      'burn()',
      'approve()',
    ],
    quiz_correct_index: 2,
  },
];

export function getAllPatterns(): EducationPatternSummary[] {
  return EDUCATION_PATTERNS.map((p) => ({
    slug: p.slug,
    title: p.title,
    category: p.category,
  }));
}

export function getPatternBySlug(slug: string): EducationPattern | null {
  return EDUCATION_PATTERNS.find((p) => p.slug === slug) || null;
}
