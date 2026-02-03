export type RiskLevel = 'low' | 'medium' | 'high' | 'dangerous';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type UserLevel = 'beginner' | 'intermediate' | 'expert';
export type InputType = 'address' | 'tx_hash' | 'source_code';
export type AuditStatus = 'none' | 'audited' | 'in_progress' | 'unknown';

export type VulnerabilityCategory =
  | 'reentrancy'
  | 'overflow'
  | 'access_control'
  | 'honeypot'
  | 'fee_misconfig'
  | 'backdoor'
  | 'upgrade_risk'
  | 'other';

export interface KeyFinding {
  title: string;
  severity: Severity;
  description: string;
}

export interface OracleData {
  tvl_usd: number | null;
  volume_24h_usd: number | null;
  age_days: number | null;
  tx_count: number | null;
  holders_count: number | null;
  audit_status: AuditStatus;
  audit_provider: string | null;
  social_sentiment_score: number | null;
  github_repo: string | null;
  github_activity_score: number | null;
}

export interface HistoryData {
  first_seen_at: string | null;
  last_seen_at: string | null;
  recent_tx_sample: {
    hash: string;
    timestamp: string;
    from: string;
    to: string;
    value: string;
    method: string | null;
  }[];
}

export interface VulnerabilityFinding {
  id: string;
  line_start: number | null;
  line_end: number | null;
  code_snippet: string | null;
  title: string;
  description: string;
  severity: Severity;
  category: VulnerabilityCategory;
  fix_suggestion: string | null;
  education_link: string | null;
}

export interface ContractAnalysis {
  id: string;
  chain_id: number;
  contract_address: string | null;
  tx_hash: string | null;
  source_code: string | null;
  abi: any | null;
  compiler_version: string | null;
  risk_score: number;
  risk_level: RiskLevel;
  confidence: number | null;
  summary_short: string;
  key_findings: KeyFinding[];
  vulnerability_findings: VulnerabilityFinding[];
  oracle_data: OracleData | null;
  history_data: HistoryData | null;
  voice_asset_url: string | null;
  analysis_version: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyzeRequest {
  input_type: InputType;
  chain_id: number;
  value: string;
  options?: {
    generate_voice?: boolean;
    user_level?: UserLevel;
  };
}

export interface AnalyzeResponse {
  analysis_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  summary_short: string;
  key_findings: KeyFinding[];
  oracle_data: OracleData | null;
  vulnerabilities: VulnerabilityFinding[];
  voice: {
    enabled: boolean;
    audio_url: string | null;
  };
}

export interface EducationAnalyzeRequest {
  source_code: string;
  options?: {
    generate_voice?: boolean;
    user_level?: UserLevel;
  };
}

export interface EducationAnalyzeResponse {
  issues: {
    title: string;
    severity: Severity;
    description: string;
    line_start: number | null;
    line_end: number | null;
  }[];
  summary: string;
  overview: string;
}

export interface EducationPattern {
  id: string;
  slug: string;
  title: string;
  category: string;
  vulnerable_code: string;
  fixed_code: string;
  explanation: string;
  quiz_question: string;
  quiz_options: string[];
  quiz_correct_index: number;
}

export interface EducationPatternSummary {
  slug: string;
  title: string;
  category: string;
}
