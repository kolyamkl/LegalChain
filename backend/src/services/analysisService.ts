import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import {
  AnalyzeRequest,
  AnalyzeResponse,
  ContractAnalysis,
  VulnerabilityFinding,
  UserLevel,
  EducationAnalyzeRequest,
  EducationAnalyzeResponse,
} from '../models/types';
import {
  analyzeSourceCode,
  hasOwnerControl,
  isContractVerified,
  DetectedVulnerability,
} from './staticAnalysis';
import { llmService } from './llmService';
import { voiceService } from './voiceService';
import { blockchainService } from './blockchainService';
import { calculateRiskScore, getRiskLevel } from '../utils/riskScoring';
import { isValidEthereumAddress, isValidTxHash } from '../utils/validators';

const prisma = new PrismaClient();

export async function analyzeContract(
  request: AnalyzeRequest
): Promise<AnalyzeResponse> {
  const { input_type, chain_id, value, options } = request;
  const generateVoice = options?.generate_voice ?? false;
  const userLevel: UserLevel = options?.user_level ?? 'beginner';

  let contractAddress: string | null = null;
  let txHash: string | null = null;
  let sourceCode: string | null = null;
  let abi: any = null;
  let compilerVersion: string | null = null;

  if (input_type === 'address') {
    if (!isValidEthereumAddress(value)) {
      throw new Error('Invalid Ethereum address format');
    }
    contractAddress = value;
    const contractInfo = await blockchainService.getContractInfo(value, chain_id);
    sourceCode = contractInfo.sourceCode;
    abi = contractInfo.abi;
    compilerVersion = contractInfo.compilerVersion;
  } else if (input_type === 'tx_hash') {
    if (!isValidTxHash(value)) {
      throw new Error('Invalid transaction hash format');
    }
    txHash = value;
    contractAddress = await blockchainService.getContractFromTxHash(value, chain_id);
    const contractInfo = await blockchainService.getContractInfo(contractAddress, chain_id);
    sourceCode = contractInfo.sourceCode;
    abi = contractInfo.abi;
    compilerVersion = contractInfo.compilerVersion;
  } else if (input_type === 'source_code') {
    sourceCode = value;
  }

  let vulnerabilities: DetectedVulnerability[] = [];
  if (sourceCode) {
    vulnerabilities = analyzeSourceCode(sourceCode);
  }

  let oracleData = null;
  let historyData = null;
  if (contractAddress) {
    oracleData = await blockchainService.getOracleData(contractAddress, chain_id);
    historyData = await blockchainService.getHistoryData(contractAddress, chain_id);
  }

  const riskScore = calculateRiskScore({
    vulnerabilities,
    oracleData,
    hasOwnerControl: sourceCode ? hasOwnerControl(sourceCode) : false,
    isVerified: isContractVerified(sourceCode),
  });
  const riskLevel = getRiskLevel(riskScore);

  const llmResult = await llmService.analyzeFindingsWithLLM(
    vulnerabilities,
    oracleData,
    userLevel
  );

  let voiceAssetUrl: string | null = null;
  if (generateVoice) {
    const voiceResult = await voiceService.generateVoiceSummary(
      llmResult.summary_short,
      riskLevel
    );
    voiceAssetUrl = voiceResult.audio_url;
  }

  const analysisId = uuidv4();

  const savedAnalysis = await prisma.contractAnalysis.create({
    data: {
      id: analysisId,
      chainId: chain_id,
      contractAddress,
      txHash,
      sourceCode,
      abi,
      compilerVersion,
      riskScore,
      riskLevel,
      confidence: 0.85,
      summaryShort: llmResult.summary_short,
      keyFindings: llmResult.key_findings as any,
      oracleData: oracleData as any,
      historyData: historyData as any,
      voiceAssetUrl,
      analysisVersion: '1.0.0',
      vulnerabilityFindings: {
        create: vulnerabilities.map((v) => ({
          id: uuidv4(),
          lineStart: v.line_start,
          lineEnd: v.line_end,
          codeSnippet: v.code_snippet,
          title: v.title,
          description: v.description,
          severity: v.severity,
          category: v.category,
          fixSuggestion: v.fix_suggestion,
          educationLink: v.education_link,
        })),
      },
    },
    include: {
      vulnerabilityFindings: true,
    },
  });

  // Type assertion for the query result
  type AnalysisWithFindings = typeof savedAnalysis & {
    vulnerabilityFindings: typeof savedAnalysis.vulnerabilityFindings;
  };
  
  return {
    analysis_id: savedAnalysis.id,
    risk_score: savedAnalysis.riskScore,
    risk_level: savedAnalysis.riskLevel as any,
    summary_short: savedAnalysis.summaryShort,
    key_findings: savedAnalysis.keyFindings as any,
    oracle_data: savedAnalysis.oracleData as any,
    vulnerabilities: (savedAnalysis as AnalysisWithFindings).vulnerabilityFindings.map((v: any) => ({
      id: v.id,
      line_start: v.lineStart,
      line_end: v.lineEnd,
      code_snippet: v.codeSnippet,
      title: v.title,
      description: v.description,
      severity: v.severity as any,
      category: v.category as any,
      fix_suggestion: v.fixSuggestion,
      education_link: v.educationLink,
    })),
    voice: {
      enabled: generateVoice,
      audio_url: voiceAssetUrl,
    },
  };
}

export async function getAnalysisById(id: string): Promise<ContractAnalysis | null> {
  const analysis = await prisma.contractAnalysis.findUnique({
    where: { id },
    include: { vulnerabilityFindings: true },
  });

  if (!analysis) {
    return null;
  }

  return {
    id: analysis.id,
    chain_id: analysis.chainId,
    contract_address: analysis.contractAddress,
    tx_hash: analysis.txHash,
    source_code: analysis.sourceCode,
    abi: analysis.abi,
    compiler_version: analysis.compilerVersion,
    risk_score: analysis.riskScore,
    risk_level: analysis.riskLevel as any,
    confidence: analysis.confidence,
    summary_short: analysis.summaryShort,
    key_findings: analysis.keyFindings as any,
    vulnerability_findings: analysis.vulnerabilityFindings.map((v) => ({
      id: v.id,
      line_start: v.lineStart,
      line_end: v.lineEnd,
      code_snippet: v.codeSnippet,
      title: v.title,
      description: v.description,
      severity: v.severity as any,
      category: v.category as any,
      fix_suggestion: v.fixSuggestion,
      education_link: v.educationLink,
    })),
    oracle_data: analysis.oracleData as any,
    history_data: analysis.historyData as any,
    voice_asset_url: analysis.voiceAssetUrl,
    analysis_version: analysis.analysisVersion,
    created_at: analysis.createdAt.toISOString(),
    updated_at: analysis.updatedAt.toISOString(),
  };
}

export async function getAnalysisByContract(
  chainId: number,
  contractAddress: string
): Promise<ContractAnalysis | null> {
  const analysis = await prisma.contractAnalysis.findFirst({
    where: {
      chainId,
      contractAddress: contractAddress.toLowerCase(),
    },
    orderBy: { createdAt: 'desc' },
    include: { vulnerabilityFindings: true },
  });

  if (!analysis) {
    return null;
  }

  return getAnalysisById(analysis.id);
}

export async function analyzeEducation(
  request: EducationAnalyzeRequest
): Promise<EducationAnalyzeResponse> {
  const { source_code, options } = request;
  const userLevel: UserLevel = options?.user_level ?? 'beginner';

  const vulnerabilities = analyzeSourceCode(source_code);

  const llmResult = await llmService.analyzeFindingsWithLLM(
    vulnerabilities,
    null,
    userLevel
  );

  return {
    issues: vulnerabilities.map((v) => ({
      title: v.title,
      severity: v.severity,
      description: v.description,
      line_start: v.line_start,
      line_end: v.line_end,
    })),
    summary: llmResult.summary_short,
    overview: llmResult.detailed_explanation || '',
  };
}
