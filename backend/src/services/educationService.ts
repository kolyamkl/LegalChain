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
  {
    id: '6',
    slug: 'front-running-attack',
    title: 'Front-Running Attack',
    category: 'front_running',
    vulnerable_code: `// VULNERABLE CODE - Front-Running Target
pragma solidity ^0.8.0;

contract VulnerableDEX {
    mapping(address => uint256) public tokenBalances;
    uint256 public tokenPrice = 1 ether;
    
    // VULNERABILITY: Price can be front-run
    function buyTokens() external payable {
        uint256 tokens = msg.value / tokenPrice;
        tokenBalances[msg.sender] += tokens;
    }
    
    // VULNERABILITY: Large trades visible in mempool
    function swapTokens(uint256 amount, uint256 minOutput) external {
        require(tokenBalances[msg.sender] >= amount);
        
        // Attacker sees this tx, buys before, sells after
        uint256 output = calculateOutput(amount);
        require(output >= minOutput, "Slippage too high");
        
        tokenBalances[msg.sender] -= amount;
        payable(msg.sender).transfer(output);
    }
    
    function calculateOutput(uint256 amount) internal view returns (uint256) {
        return amount * tokenPrice / 1e18;
    }
}`,
    fixed_code: `// FIXED CODE - Front-Running Protection
pragma solidity ^0.8.0;

contract SafeDEX {
    mapping(address => uint256) public tokenBalances;
    mapping(bytes32 => bool) public usedCommitments;
    mapping(address => bytes32) public pendingSwaps;
    
    uint256 public constant COMMIT_DELAY = 2; // blocks
    
    // Commit-reveal scheme prevents front-running
    function commitSwap(bytes32 commitment) external {
        pendingSwaps[msg.sender] = commitment;
    }
    
    function executeSwap(
        uint256 amount, 
        uint256 minOutput,
        bytes32 secret
    ) external {
        bytes32 commitment = keccak256(abi.encodePacked(
            msg.sender, amount, minOutput, secret
        ));
        
        require(pendingSwaps[msg.sender] == commitment, "Invalid commitment");
        require(!usedCommitments[commitment], "Already used");
        
        usedCommitments[commitment] = true;
        delete pendingSwaps[msg.sender];
        
        // Execute swap with slippage protection
        uint256 output = calculateOutput(amount);
        require(output >= minOutput, "Slippage exceeded");
        
        tokenBalances[msg.sender] -= amount;
        payable(msg.sender).transfer(output);
    }
    
    function calculateOutput(uint256 amount) internal view returns (uint256) {
        // Implementation
        return amount;
    }
}`,
    explanation: `## Front-Running Attacks

Front-running occurs when an attacker observes a pending transaction and submits their own transaction with higher gas to execute first.

### How It Works:
1. User submits a large swap transaction
2. Attacker sees it in the mempool
3. Attacker buys tokens before user's tx (higher gas)
4. User's tx executes at worse price
5. Attacker sells immediately after for profit

### Protection Methods:
1. **Commit-Reveal Schemes**: Hide transaction details until execution
2. **Slippage Protection**: Set minimum acceptable output
3. **Private Mempools**: Use Flashbots or similar services
4. **Batch Auctions**: Process orders in batches at uniform price

### Real Impact:
MEV (Maximal Extractable Value) from front-running exceeds $1B annually on Ethereum.`,
    quiz_question: 'What is the best protection against front-running?',
    quiz_options: [
      'Using more gas',
      'Commit-reveal schemes with slippage protection',
      'Making transactions smaller',
      'Using older Solidity versions',
    ],
    quiz_correct_index: 1,
  },
  {
    id: '7',
    slug: 'delegatecall-vulnerability',
    title: 'Delegatecall Vulnerability',
    category: 'delegatecall',
    vulnerable_code: `// VULNERABLE CODE - Unsafe Delegatecall
pragma solidity ^0.8.0;

contract VulnerableProxy {
    address public implementation;
    address public owner;
    
    constructor(address _impl) {
        implementation = _impl;
        owner = msg.sender;
    }
    
    // VULNERABILITY: Anyone can call any function
    fallback() external payable {
        (bool success, ) = implementation.delegatecall(msg.data);
        require(success, "Delegatecall failed");
    }
    
    // VULNERABILITY: No storage collision protection
    function upgrade(address newImpl) external {
        require(msg.sender == owner, "Not owner");
        implementation = newImpl;
    }
}

contract MaliciousImplementation {
    // Storage slot 0 - will overwrite 'implementation'
    address public maliciousAddr;
    // Storage slot 1 - will overwrite 'owner'  
    address public newOwner;
    
    function attack() external {
        // This overwrites proxy's storage!
        newOwner = msg.sender;
    }
}`,
    fixed_code: `// FIXED CODE - Safe Proxy Pattern
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

// Use OpenZeppelin's battle-tested proxy
contract SafeProxy is ERC1967Proxy {
    constructor(
        address _logic,
        bytes memory _data
    ) ERC1967Proxy(_logic, _data) {}
}

// Implementation with proper storage layout
contract SafeImplementation is UUPSUpgradeable {
    // Use storage gaps to prevent collisions
    uint256[50] private __gap;
    
    address public owner;
    uint256 public value;
    
    function initialize(address _owner) external {
        require(owner == address(0), "Already initialized");
        owner = _owner;
    }
    
    function _authorizeUpgrade(address) internal override {
        require(msg.sender == owner, "Not owner");
    }
}`,
    explanation: `## Delegatecall Vulnerabilities

Delegatecall executes code from another contract in the context of the calling contract, using the caller's storage.

### Dangers:
1. **Storage Collision**: Called contract can overwrite critical storage
2. **Context Confusion**: msg.sender and msg.value are preserved
3. **Upgrade Attacks**: Malicious upgrades can steal funds

### Storage Layout:
\`\`\`
Proxy Storage:        Implementation Storage:
Slot 0: implementation    Slot 0: someVar (COLLISION!)
Slot 1: owner            Slot 1: anotherVar (COLLISION!)
\`\`\`

### Safe Patterns:
1. Use ERC-1967 standard storage slots
2. Use OpenZeppelin's proxy contracts
3. Implement storage gaps for upgrades
4. Always audit implementation contracts`,
    quiz_question: 'What is the main risk with delegatecall?',
    quiz_options: [
      'It uses too much gas',
      'Storage collision with the calling contract',
      'It cannot return values',
      'It only works with ETH transfers',
    ],
    quiz_correct_index: 1,
  },
  {
    id: '8',
    slug: 'timestamp-dependence',
    title: 'Timestamp Dependence',
    category: 'timestamp',
    vulnerable_code: `// VULNERABLE CODE - Timestamp Manipulation
pragma solidity ^0.8.0;

contract VulnerableLottery {
    uint256 public jackpot;
    uint256 public lastPlayTime;
    
    function play() external payable {
        require(msg.value >= 0.1 ether, "Min bet 0.1 ETH");
        jackpot += msg.value;
        
        // VULNERABILITY: Miner can manipulate timestamp
        if (block.timestamp % 15 == 0) {
            payable(msg.sender).transfer(jackpot);
            jackpot = 0;
        }
    }
    
    // VULNERABILITY: Predictable "randomness"
    function getRandomNumber() public view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender
        )));
    }
    
    // VULNERABILITY: Time-based unlock
    function withdrawAfterDelay() external {
        require(block.timestamp > lastPlayTime + 1 hours);
        // Miner can set timestamp to bypass this
    }
}`,
    fixed_code: `// FIXED CODE - Secure Randomness
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract SafeLottery is VRFConsumerBase {
    bytes32 internal keyHash;
    uint256 internal fee;
    uint256 public randomResult;
    
    mapping(bytes32 => address) public requestToPlayer;
    
    constructor() VRFConsumerBase(
        0x... , // VRF Coordinator
        0x...   // LINK Token
    ) {
        keyHash = 0x...;
        fee = 0.1 * 10**18;
    }
    
    function play() external payable returns (bytes32) {
        require(msg.value >= 0.1 ether);
        require(LINK.balanceOf(address(this)) >= fee);
        
        // Request randomness from Chainlink VRF
        bytes32 requestId = requestRandomness(keyHash, fee);
        requestToPlayer[requestId] = msg.sender;
        return requestId;
    }
    
    function fulfillRandomness(
        bytes32 requestId, 
        uint256 randomness
    ) internal override {
        address player = requestToPlayer[requestId];
        
        // True randomness - cannot be manipulated
        if (randomness % 100 < 10) { // 10% win chance
            payable(player).transfer(address(this).balance);
        }
    }
}`,
    explanation: `## Timestamp Dependence

Block timestamps can be slightly manipulated by miners (within ~15 seconds), making them unsuitable for critical logic.

### Vulnerable Uses:
1. **Randomness**: Using timestamp as random seed
2. **Time locks**: Short duration time-based locks
3. **Lottery/Gaming**: Determining winners
4. **Auctions**: Ending times

### Miner Manipulation:
- Miners can adjust timestamp within ~15 seconds
- They can choose not to include transactions
- They can reorder transactions

### Safe Alternatives:
1. **Chainlink VRF**: Verifiable random function
2. **Commit-Reveal**: For randomness
3. **Block numbers**: For longer time periods
4. **External oracles**: For time-sensitive data`,
    quiz_question: 'Why is block.timestamp unsafe for randomness?',
    quiz_options: [
      'It changes too fast',
      'Miners can manipulate it within ~15 seconds',
      'It is always zero',
      'It uses too much gas',
    ],
    quiz_correct_index: 1,
  },
  {
    id: '9',
    slug: 'unchecked-return-value',
    title: 'Unchecked Return Values',
    category: 'unchecked_return',
    vulnerable_code: `// VULNERABLE CODE - Unchecked Returns
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract VulnerableVault {
    IERC20 public token;
    mapping(address => uint256) public deposits;
    
    constructor(address _token) {
        token = IERC20(_token);
    }
    
    function deposit(uint256 amount) external {
        // VULNERABILITY: Return value not checked!
        // Some tokens return false instead of reverting
        token.transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
    }
    
    function withdraw(uint256 amount) external {
        require(deposits[msg.sender] >= amount);
        deposits[msg.sender] -= amount;
        
        // VULNERABILITY: If transfer fails silently, 
        // user loses their deposit record but keeps tokens
        token.transfer(msg.sender, amount);
    }
}`,
    fixed_code: `// FIXED CODE - Safe Token Transfers
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SafeVault {
    using SafeERC20 for IERC20;
    
    IERC20 public token;
    mapping(address => uint256) public deposits;
    
    constructor(address _token) {
        token = IERC20(_token);
    }
    
    function deposit(uint256 amount) external {
        // SafeERC20 reverts if transfer fails
        token.safeTransferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
    }
    
    function withdraw(uint256 amount) external {
        require(deposits[msg.sender] >= amount, "Insufficient");
        deposits[msg.sender] -= amount;
        
        // Safe transfer - reverts on failure
        token.safeTransfer(msg.sender, amount);
    }
}`,
    explanation: `## Unchecked Return Values

Some ERC-20 tokens don't revert on failure - they return false instead. Not checking this can lead to serious bugs.

### Problem Tokens:
- **USDT**: Doesn't return a value at all
- **BNB**: Returns false on failure
- **Some tokens**: Have non-standard implementations

### Consequences:
1. Silent failures in deposits
2. Accounting mismatches
3. Loss of funds
4. Exploitable state inconsistencies

### Solution - SafeERC20:
OpenZeppelin's SafeERC20 library:
- Checks return values
- Handles tokens with no return value
- Reverts on any failure
- Works with all ERC-20 variants`,
    quiz_question: 'Why should you use SafeERC20 for token transfers?',
    quiz_options: [
      'It is faster',
      'Some tokens return false instead of reverting on failure',
      'It uses less gas',
      'It is required by the ERC-20 standard',
    ],
    quiz_correct_index: 1,
  },
  {
    id: '10',
    slug: 'denial-of-service',
    title: 'Denial of Service (DoS)',
    category: 'dos',
    vulnerable_code: `// VULNERABLE CODE - DoS Vulnerabilities
pragma solidity ^0.8.0;

contract VulnerableAuction {
    address public highestBidder;
    uint256 public highestBid;
    
    // VULNERABILITY: Refund can fail, blocking new bids
    function bid() external payable {
        require(msg.value > highestBid, "Bid too low");
        
        // If this transfer fails, no one can bid anymore!
        if (highestBidder != address(0)) {
            payable(highestBidder).transfer(highestBid);
        }
        
        highestBidder = msg.sender;
        highestBid = msg.value;
    }
}

contract VulnerableDistributor {
    address[] public recipients;
    
    // VULNERABILITY: Unbounded loop can run out of gas
    function distribute() external payable {
        uint256 share = msg.value / recipients.length;
        
        // If array is too large, this will always fail
        for (uint i = 0; i < recipients.length; i++) {
            payable(recipients[i]).transfer(share);
        }
    }
}`,
    fixed_code: `// FIXED CODE - DoS Resistant
pragma solidity ^0.8.0;

contract SafeAuction {
    address public highestBidder;
    uint256 public highestBid;
    mapping(address => uint256) public pendingReturns;
    
    function bid() external payable {
        require(msg.value > highestBid, "Bid too low");
        
        // Store refund for later withdrawal (pull pattern)
        if (highestBidder != address(0)) {
            pendingReturns[highestBidder] += highestBid;
        }
        
        highestBidder = msg.sender;
        highestBid = msg.value;
    }
    
    // Users withdraw their own refunds
    function withdraw() external {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        
        pendingReturns[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}

contract SafeDistributor {
    mapping(address => uint256) public shares;
    
    function setShare(address recipient, uint256 amount) external {
        shares[recipient] = amount;
    }
    
    // Pull pattern - users claim their own shares
    function claim() external {
        uint256 amount = shares[msg.sender];
        require(amount > 0, "No shares");
        
        shares[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}`,
    explanation: `## Denial of Service Attacks

DoS attacks prevent legitimate users from using a contract by exploiting design flaws.

### Common DoS Vectors:
1. **Failed External Calls**: Contract that always reverts
2. **Gas Limits**: Unbounded loops exceeding block gas limit
3. **Unexpected Reverts**: Malicious contracts in arrays
4. **Block Stuffing**: Filling blocks to prevent transactions

### The Pull vs Push Pattern:
- **Push (Vulnerable)**: Contract sends funds to users
- **Pull (Safe)**: Users withdraw their own funds

### Prevention:
1. Use pull over push for payments
2. Limit loop iterations
3. Handle failed transfers gracefully
4. Set reasonable gas limits for external calls`,
    quiz_question: 'What is the safest pattern for distributing funds?',
    quiz_options: [
      'Push pattern - send to all users in a loop',
      'Pull pattern - let users withdraw themselves',
      'Send all funds to one address',
      'Use delegatecall for transfers',
    ],
    quiz_correct_index: 1,
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
