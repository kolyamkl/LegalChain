import type {
  AnalyzeResponse,
  ContractAnalysis,
  EducationPatternSummary,
  EducationPattern,
  EducationAnalyzeResponse,
  InputType,
  UserLevel,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export async function analyzeContract(
  inputType: InputType,
  value: string,
  options?: {
    chainId?: number;
    generateVoice?: boolean;
    userLevel?: UserLevel;
  }
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input_type: inputType,
      chain_id: options?.chainId ?? 1,
      value,
      options: {
        generate_voice: options?.generateVoice ?? false,
        user_level: options?.userLevel ?? 'beginner',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Analysis failed');
  }

  return response.json();
}

export async function getAnalysisById(id: string): Promise<ContractAnalysis> {
  const response = await fetch(`${API_URL}/api/analysis/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch analysis');
  }

  return response.json();
}

export async function getAnalysisByContract(
  chainId: number,
  contractAddress: string
): Promise<ContractAnalysis> {
  const response = await fetch(
    `${API_URL}/api/analysis/by-contract?chain_id=${chainId}&contract_address=${contractAddress}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch analysis');
  }

  return response.json();
}

export async function getEducationPatterns(): Promise<EducationPatternSummary[]> {
  const response = await fetch(`${API_URL}/api/education/patterns`);

  if (!response.ok) {
    throw new Error('Failed to fetch patterns');
  }

  return response.json();
}

export async function getEducationPattern(slug: string): Promise<EducationPattern> {
  const response = await fetch(`${API_URL}/api/education/patterns/${slug}`);

  if (!response.ok) {
    throw new Error('Failed to fetch pattern');
  }

  return response.json();
}

export async function analyzeEducationCode(
  sourceCode: string,
  options?: {
    generateVoice?: boolean;
    userLevel?: UserLevel;
  }
): Promise<EducationAnalyzeResponse> {
  const response = await fetch(`${API_URL}/api/analyze/education`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_code: sourceCode,
      options: {
        generate_voice: options?.generateVoice ?? false,
        user_level: options?.userLevel ?? 'beginner',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Education analysis failed');
  }

  return response.json();
}

export function detectInputType(value: string): InputType | null {
  const trimmed = value.trim();
  
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return 'address';
  }
  
  if (/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
    return 'tx_hash';
  }
  
  const solidityIndicators = [
    'pragma solidity',
    'contract ',
    'function ',
    'mapping(',
  ];
  if (solidityIndicators.some((ind) => trimmed.toLowerCase().includes(ind.toLowerCase()))) {
    return 'source_code';
  }
  
  return null;
}
