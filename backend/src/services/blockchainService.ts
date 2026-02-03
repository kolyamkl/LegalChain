import { OracleData, HistoryData } from '../models/types';

export interface ContractInfo {
  address: string;
  sourceCode: string | null;
  abi: any | null;
  compilerVersion: string | null;
  contractName: string | null;
  isVerified: boolean;
}

export interface BlockchainServiceInterface {
  getContractInfo(address: string, chainId: number): Promise<ContractInfo>;
  getContractFromTxHash(txHash: string, chainId: number): Promise<string>;
  getOracleData(address: string, chainId: number): Promise<OracleData>;
  getHistoryData(address: string, chainId: number): Promise<HistoryData>;
}

export class MockBlockchainService implements BlockchainServiceInterface {
  private mockContracts: Record<string, ContractInfo> = {
    '0x1234567890123456789012345678901234567890': {
      address: '0x1234567890123456789012345678901234567890',
      sourceCode: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VulnerableToken {
    mapping(address => uint256) public balances;
    address public owner;
    uint256 public taxRate = 5;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Vulnerable: state change after external call
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] -= amount;
    }

    function withdrawAll() external onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    function setTaxRate(uint256 newRate) external onlyOwner {
        taxRate = newRate;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
      `.trim(),
      abi: [],
      compilerVersion: '0.8.19',
      contractName: 'VulnerableToken',
      isVerified: true,
    },
  };

  async getContractInfo(address: string, chainId: number): Promise<ContractInfo> {
    const normalizedAddress = address.toLowerCase();
    
    if (this.mockContracts[normalizedAddress]) {
      return this.mockContracts[normalizedAddress];
    }

    return {
      address,
      sourceCode: this.generateMockSourceCode(address),
      abi: [],
      compilerVersion: '0.8.19',
      contractName: 'UnknownContract',
      isVerified: Math.random() > 0.3,
    };
  }

  async getContractFromTxHash(txHash: string, chainId: number): Promise<string> {
    return '0x' + txHash.slice(2, 42);
  }

  async getOracleData(address: string, chainId: number): Promise<OracleData> {
    const hash = this.simpleHash(address);
    
    return {
      tvl_usd: Math.floor(hash % 10000000),
      volume_24h_usd: Math.floor((hash * 7) % 1000000),
      age_days: Math.floor((hash * 3) % 1000),
      tx_count: Math.floor((hash * 11) % 100000),
      holders_count: Math.floor((hash * 13) % 10000),
      audit_status: hash % 4 === 0 ? 'audited' : hash % 4 === 1 ? 'none' : 'unknown',
      audit_provider: hash % 4 === 0 ? 'CertiK' : null,
      social_sentiment_score: null,
      github_repo: null,
      github_activity_score: null,
    };
  }

  async getHistoryData(address: string, chainId: number): Promise<HistoryData> {
    const now = new Date();
    const firstSeen = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    
    return {
      first_seen_at: firstSeen.toISOString(),
      last_seen_at: now.toISOString(),
      recent_tx_sample: [
        {
          hash: '0x' + 'a'.repeat(64),
          timestamp: new Date(now.getTime() - 3600000).toISOString(),
          from: '0x' + '1'.repeat(40),
          to: address,
          value: '1000000000000000000',
          method: 'deposit',
        },
        {
          hash: '0x' + 'b'.repeat(64),
          timestamp: new Date(now.getTime() - 7200000).toISOString(),
          from: '0x' + '2'.repeat(40),
          to: address,
          value: '500000000000000000',
          method: 'withdraw',
        },
      ],
    };
  }

  private generateMockSourceCode(address: string): string {
    return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GeneratedContract {
    address public owner;
    mapping(address => uint256) public balances;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount);
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }
}
    `.trim();
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export class EtherscanBlockchainService implements BlockchainServiceInterface {
  private apiKey: string;
  private baseUrls: Record<number, string> = {
    1: 'https://api.etherscan.io/api',
    5: 'https://api-goerli.etherscan.io/api',
    11155111: 'https://api-sepolia.etherscan.io/api',
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getContractInfo(address: string, chainId: number): Promise<ContractInfo> {
    const baseUrl = this.baseUrls[chainId] || this.baseUrls[1];
    
    try {
      const response = await fetch(
        `${baseUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${this.apiKey}`
      );
      const data = await response.json();

      if (data.status === '1' && data.result && data.result[0]) {
        const result = data.result[0];
        return {
          address,
          sourceCode: result.SourceCode || null,
          abi: result.ABI !== 'Contract source code not verified' ? JSON.parse(result.ABI) : null,
          compilerVersion: result.CompilerVersion || null,
          contractName: result.ContractName || null,
          isVerified: result.SourceCode !== '',
        };
      }

      return {
        address,
        sourceCode: null,
        abi: null,
        compilerVersion: null,
        contractName: null,
        isVerified: false,
      };
    } catch (error) {
      console.error('[EtherscanService] Error fetching contract info:', error);
      throw error;
    }
  }

  async getContractFromTxHash(txHash: string, chainId: number): Promise<string> {
    const baseUrl = this.baseUrls[chainId] || this.baseUrls[1];
    
    try {
      const response = await fetch(
        `${baseUrl}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${this.apiKey}`
      );
      const data = await response.json();

      if (data.result && data.result.to) {
        return data.result.to;
      }

      throw new Error('Could not find contract address from transaction');
    } catch (error) {
      console.error('[EtherscanService] Error fetching tx:', error);
      throw error;
    }
  }

  async getOracleData(address: string, chainId: number): Promise<OracleData> {
    const mockService = new MockBlockchainService();
    return mockService.getOracleData(address, chainId);
  }

  async getHistoryData(address: string, chainId: number): Promise<HistoryData> {
    const mockService = new MockBlockchainService();
    return mockService.getHistoryData(address, chainId);
  }
}

export function createBlockchainService(): BlockchainServiceInterface {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (apiKey && apiKey !== 'YOUR_ETHERSCAN_API_KEY') {
    return new EtherscanBlockchainService(apiKey);
  }
  return new MockBlockchainService();
}

export const blockchainService = createBlockchainService();
