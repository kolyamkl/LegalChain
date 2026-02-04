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
  // Etherscan V2 API uses a single base URL with chainid parameter
  private baseUrl = 'https://api.etherscan.io/v2/api';
  
  // Chain ID mapping for Etherscan V2
  private chainIds: Record<number, number> = {
    1: 1,         // Ethereum Mainnet
    5: 5,         // Goerli (deprecated)
    11155111: 11155111, // Sepolia
    137: 137,     // Polygon
    56: 56,       // BSC
    42161: 42161, // Arbitrum
    10: 10,       // Optimism
    8453: 8453,   // Base
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Helper to build V2 API URL
  private buildUrl(params: Record<string, string | number>, chainId: number = 1): string {
    const chainIdNum = this.chainIds[chainId] || 1;
    const queryParams = new URLSearchParams({
      chainid: chainIdNum.toString(),
      apikey: this.apiKey,
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ),
    });
    return `${this.baseUrl}?${queryParams.toString()}`;
  }

  async getContractInfo(address: string, chainId: number): Promise<ContractInfo> {
    try {
      const url = this.buildUrl({
        module: 'contract',
        action: 'getsourcecode',
        address,
      }, chainId);
      
      const response = await fetch(url);
      const data = await response.json() as {
        status: string;
        result?: Array<{
          SourceCode?: string;
          ABI?: string;
          CompilerVersion?: string;
          ContractName?: string;
        }>;
      };

      if (data.status === '1' && data.result && data.result[0]) {
        const result = data.result[0];
        return {
          address,
          sourceCode: result.SourceCode || null,
          abi: result.ABI !== 'Contract source code not verified' ? JSON.parse(result.ABI!) : null,
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
    try {
      const url = this.buildUrl({ module: 'proxy', action: 'eth_getTransactionByHash', txhash: txHash }, chainId);
      const response = await fetch(url);
      const data = await response.json() as {
        result?: { to?: string };
      };

      if (data.result && data.result.to) {
        return data.result.to;
      }

      throw new Error('Could not find contract address from transaction');
    } catch (error) {
      console.error('[EtherscanService] Error fetching tx:', error);
      throw error;
    }
  }

  // Helper to check if Etherscan response is valid
  private isValidEtherscanResponse(data: any, context: string = ''): boolean {
    // Check for API error messages
    if (typeof data === 'string' && data.includes('deprecated')) {
      console.log(`[EtherscanService] ${context}: Invalid (deprecated string)`);
      return false;
    }
    if (data.message && typeof data.message === 'string' && data.message.includes('NOTOK')) {
      console.log(`[EtherscanService] ${context}: Invalid (NOTOK): ${data.result || data.message}`);
      return false;
    }
    if (data.result && typeof data.result === 'string' && data.result.includes('deprecated')) {
      console.log(`[EtherscanService] ${context}: Invalid (deprecated result)`);
      return false;
    }
    return true;
  }

  // Helper to safely parse hex numbers
  private safeParseHex(value: string | undefined): number | null {
    if (!value || typeof value !== 'string') return null;
    if (!value.startsWith('0x')) return null;
    try {
      return parseInt(value, 16);
    } catch {
      return null;
    }
  }

  // Helper to safely parse BigInt from balance
  private safeParseBigInt(value: string | undefined): bigint {
    if (!value || typeof value !== 'string') return BigInt(0);
    // Only parse if it looks like a number (digits only or hex)
    if (!/^(0x)?[0-9a-fA-F]+$/.test(value)) return BigInt(0);
    try {
      return BigInt(value);
    } catch {
      return BigInt(0);
    }
  }

  async getOracleData(address: string, chainId: number): Promise<OracleData> {
    console.log(`[EtherscanService] Fetching oracle data for ${address}...`);
    
    try {
      // Fetch contract creation info (includes timestamp!) - 1 API call
      const creationUrl = this.buildUrl({
        module: 'contract',
        action: 'getcontractcreation',
        contractaddresses: address,
      }, chainId);
      const creationResponse = await fetch(creationUrl);
      const creationData = await creationResponse.json() as { 
        status: string;
        result?: Array<{ txHash?: string; timestamp?: string }>;
      };
      console.log(`[EtherscanService] creation response:`, JSON.stringify(creationData).slice(0, 300));

      let ageDays: number | null = null;
      
      // V2 API returns timestamp directly in the creation response!
      if (this.isValidEtherscanResponse(creationData, 'creation') && 
          creationData.status === '1' && 
          creationData.result && 
          creationData.result[0]?.timestamp) {
        const creationTimestamp = parseInt(creationData.result[0].timestamp) * 1000;
        const now = Date.now();
        ageDays = Math.floor((now - creationTimestamp) / (24 * 60 * 60 * 1000));
        console.log(`[EtherscanService] Contract age: ${ageDays} days (created: ${new Date(creationTimestamp).toISOString()})`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 350));

      // Fetch normal transactions to estimate activity - 1 API call
      const txListUrl = this.buildUrl({
        module: 'account',
        action: 'txlist',
        address,
        startblock: 0,
        endblock: 99999999,
        page: 1,
        offset: 100,
        sort: 'desc',
      }, chainId);
      const txListResponse = await fetch(txListUrl);
      const txListData = await txListResponse.json() as { 
        status: string;
        result?: Array<any>;
      };
      console.log(`[EtherscanService] txList status: ${txListData.status}, count: ${Array.isArray(txListData.result) ? txListData.result.length : 'N/A'}`);
      
      const recentTxCount = this.isValidEtherscanResponse(txListData, 'txList') && 
        txListData.status === '1' && 
        Array.isArray(txListData.result) 
          ? txListData.result.length 
          : null;

      // For ERC-20 tokens, try to get holder count (this is limited in Etherscan free API)
      // We'll use a heuristic based on unique addresses in recent transactions
      let holdersCount: number | null = null;
      if (this.isValidEtherscanResponse(txListData, 'txListHolders') && 
          txListData.status === '1' && 
          Array.isArray(txListData.result)) {
        const uniqueAddresses = new Set<string>();
        for (const tx of txListData.result) {
          if (tx.from) uniqueAddresses.add(tx.from.toLowerCase());
          if (tx.to) uniqueAddresses.add(tx.to.toLowerCase());
        }
        holdersCount = uniqueAddresses.size;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 350));

      // Get contract balance for rough TVL estimate (in ETH) - 1 API call
      const balanceUrl = this.buildUrl({
        module: 'account',
        action: 'balance',
        address,
        tag: 'latest',
      }, chainId);
      const balanceResponse = await fetch(balanceUrl);
      const balanceData = await balanceResponse.json() as { status?: string; result?: string };
      console.log(`[EtherscanService] balance response: status=${balanceData.status}, result=${balanceData.result?.slice(0, 50)}`);
      
      let tvlUsd: number | null = null;
      if (this.isValidEtherscanResponse(balanceData) && balanceData.status === '1') {
        const balanceWei = this.safeParseBigInt(balanceData.result);
        // Rough ETH price estimate for TVL calculation
        const ethPrice = 2000; // Approximate ETH price in USD
        const tvl = Number(balanceWei / BigInt(10 ** 18)) * ethPrice;
        tvlUsd = tvl > 0 ? tvl : null;
      }

      console.log(`[EtherscanService] ✅ Oracle data: age=${ageDays}d, txCount=${recentTxCount}, holders=${holdersCount}, tvl=$${tvlUsd}`);

      return {
        tvl_usd: tvlUsd,
        volume_24h_usd: null, // Would need DeFiLlama integration
        age_days: ageDays,
        tx_count: recentTxCount,
        holders_count: holdersCount,
        audit_status: 'unknown', // Would need integration with audit databases
        audit_provider: null,
        social_sentiment_score: null,
        github_repo: null,
        github_activity_score: null,
      };
    } catch (error) {
      console.error('[EtherscanService] Error fetching oracle data:', error);
      // Fall back to basic data on error
      return {
        tvl_usd: null,
        volume_24h_usd: null,
        age_days: null,
        tx_count: null,
        holders_count: null,
        audit_status: 'unknown',
        audit_provider: null,
        social_sentiment_score: null,
        github_repo: null,
        github_activity_score: null,
      };
    }
  }

  async getHistoryData(address: string, chainId: number): Promise<HistoryData> {
    try {
      const url = this.buildUrl({
        module: 'account',
        action: 'txlist',
        address,
        startblock: 0,
        endblock: 99999999,
        page: 1,
        offset: 10,
        sort: 'desc',
      }, chainId);
      const response = await fetch(url);
      const data = await response.json() as {
        status: string;
        result?: Array<{
          hash: string;
          timeStamp: string;
          from: string;
          to: string;
          value: string;
          functionName?: string;
        }>;
      };

      if (data.status === '1' && Array.isArray(data.result) && data.result.length > 0) {
        const transactions = data.result;
        const lastTx = transactions[0];
        const firstTx = transactions[transactions.length - 1];

        return {
          first_seen_at: new Date(parseInt(firstTx.timeStamp) * 1000).toISOString(),
          last_seen_at: new Date(parseInt(lastTx.timeStamp) * 1000).toISOString(),
          recent_tx_sample: transactions.slice(0, 5).map(tx => ({
            hash: tx.hash,
            timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            from: tx.from,
            to: tx.to || address,
            value: tx.value,
            method: tx.functionName?.split('(')[0] || null,
          })),
        };
      }

      return {
        first_seen_at: null,
        last_seen_at: null,
        recent_tx_sample: [],
      };
    } catch (error) {
      console.error('[EtherscanService] Error fetching history:', error);
      return {
        first_seen_at: null,
        last_seen_at: null,
        recent_tx_sample: [],
      };
    }
  }
}

export function createBlockchainService(): BlockchainServiceInterface {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (apiKey && apiKey !== 'YOUR_ETHERSCAN_API_KEY') {
    console.log('🔗 Blockchain Service: Etherscan (real data)');
    return new EtherscanBlockchainService(apiKey);
  }
  console.log('🔗 Blockchain Service: Mock');
  return new MockBlockchainService();
}

export const blockchainService = createBlockchainService();
