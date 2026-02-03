import { RiskLevel, Severity, OracleData } from '../models/types';

interface ScoringInput {
  vulnerabilities: { severity: Severity }[];
  oracleData: OracleData | null;
  hasOwnerControl: boolean;
  isVerified: boolean;
}

export function calculateRiskScore(input: ScoringInput): number {
  let score = 50;

  for (const vuln of input.vulnerabilities) {
    switch (vuln.severity) {
      case 'critical':
        score += 25;
        break;
      case 'high':
        score += 15;
        break;
      case 'medium':
        score += 8;
        break;
      case 'low':
        score += 3;
        break;
    }
  }

  if (input.hasOwnerControl) {
    score += 15;
  }

  if (!input.isVerified) {
    score += 10;
  }

  if (input.oracleData) {
    if (input.oracleData.age_days !== null && input.oracleData.age_days < 7) {
      score += 10;
    }

    if (input.oracleData.age_days !== null && input.oracleData.age_days > 365) {
      score -= 10;
    }

    if (input.oracleData.tx_count !== null && input.oracleData.tx_count > 10000) {
      score -= 5;
    }

    if (input.oracleData.audit_status === 'audited') {
      score -= 20;
    }

    if (input.oracleData.holders_count !== null && input.oracleData.holders_count > 1000) {
      score -= 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 20) return 'low';
  if (score <= 40) return 'medium';
  if (score <= 70) return 'high';
  return 'dangerous';
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return '#22c55e';
    case 'medium':
      return '#eab308';
    case 'high':
      return '#f97316';
    case 'dangerous':
      return '#ef4444';
  }
}
