import { z } from 'zod';

export const analyzeRequestSchema = z.object({
  input_type: z.enum(['address', 'tx_hash', 'source_code']),
  chain_id: z.number().int().positive(),
  value: z.string().min(1),
  options: z
    .object({
      generate_voice: z.boolean().optional(),
      user_level: z.enum(['beginner', 'intermediate', 'expert']).optional(),
    })
    .optional(),
});

export const educationAnalyzeRequestSchema = z.object({
  source_code: z.string().min(1),
  options: z
    .object({
      generate_voice: z.boolean().optional(),
      user_level: z.enum(['beginner', 'intermediate', 'expert']).optional(),
    })
    .optional(),
});

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

export function isSolidityCode(code: string): boolean {
  const solidityIndicators = [
    'pragma solidity',
    'contract ',
    'function ',
    'mapping(',
    'address ',
    'uint256',
    'uint ',
    'bytes32',
  ];
  const lowerCode = code.toLowerCase();
  return solidityIndicators.some((indicator) =>
    lowerCode.includes(indicator.toLowerCase())
  );
}

export function detectInputType(
  value: string
): 'address' | 'tx_hash' | 'source_code' | null {
  if (isValidEthereumAddress(value)) {
    return 'address';
  }
  if (isValidTxHash(value)) {
    return 'tx_hash';
  }
  if (isSolidityCode(value)) {
    return 'source_code';
  }
  return null;
}
