import { KeyFinding, UserLevel, Severity, OracleData } from '../models/types';
import { DetectedVulnerability } from './staticAnalysis';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface LLMAnalysisResult {
  summary_short: string;
  key_findings: KeyFinding[];
  detailed_explanation?: string;
}

export interface LLMServiceInterface {
  analyzeFindingsWithLLM(
    technicalFindings: DetectedVulnerability[],
    oracleData: OracleData | null,
    userLevel: UserLevel
  ): Promise<LLMAnalysisResult>;
}

// Real OpenAI LLM Service
export class OpenAILLMService implements LLMServiceInterface {
  async analyzeFindingsWithLLM(
    technicalFindings: DetectedVulnerability[],
    oracleData: OracleData | null,
    userLevel: UserLevel
  ): Promise<LLMAnalysisResult> {
    try {
      const prompt = this.buildPrompt(technicalFindings, oracleData, userLevel);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a smart contract security expert. Analyze the provided security findings and explain them clearly.
            
Your response MUST be a valid JSON object with this exact structure:
{
  "summary_short": "A 1-2 sentence summary of the overall risk level",
  "key_findings": [
    {
      "title": "Finding title",
      "severity": "critical|high|medium|low",
      "description": "Clear explanation of the issue"
    }
  ],
  "detailed_explanation": "A longer explanation of all findings and recommendations"
}

${userLevel === 'beginner' 
  ? 'Explain in simple terms that someone new to crypto would understand. Avoid technical jargon. Use analogies when helpful.'
  : 'Provide technical details appropriate for an experienced developer or auditor.'}

Always respond with valid JSON only, no additional text.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const result = JSON.parse(content) as LLMAnalysisResult;
      
      // Validate and normalize severities
      result.key_findings = result.key_findings.map(f => ({
        ...f,
        severity: this.normalizeSeverity(f.severity)
      }));

      return result;
    } catch (error) {
      console.error('OpenAI LLM analysis failed:', error);
      // Fall back to mock service
      return new MockLLMService().analyzeFindingsWithLLM(technicalFindings, oracleData, userLevel);
    }
  }

  private buildPrompt(
    technicalFindings: DetectedVulnerability[],
    oracleData: OracleData | null,
    userLevel: UserLevel
  ): string {
    let prompt = `Analyze this smart contract security report:\n\n`;
    
    if (technicalFindings.length === 0) {
      prompt += `No vulnerabilities were detected by static analysis.\n\n`;
    } else {
      prompt += `DETECTED VULNERABILITIES (${technicalFindings.length} total):\n`;
      for (const finding of technicalFindings) {
        prompt += `\n- ${finding.title} [${finding.severity.toUpperCase()}]\n`;
        prompt += `  Description: ${finding.description}\n`;
        if (finding.code_snippet) {
          prompt += `  Code: ${finding.code_snippet}\n`;
        }
        if (finding.fix_suggestion) {
          prompt += `  Suggested fix: ${finding.fix_suggestion}\n`;
        }
      }
    }

    if (oracleData) {
      prompt += `\nON-CHAIN DATA:\n`;
      if (oracleData.age_days !== null) prompt += `- Contract age: ${oracleData.age_days} days\n`;
      if (oracleData.tx_count !== null) prompt += `- Transaction count: ${oracleData.tx_count.toLocaleString()}\n`;
      if (oracleData.holders_count !== null) prompt += `- Holder count: ${oracleData.holders_count.toLocaleString()}\n`;
      if (oracleData.tvl_usd !== null) prompt += `- TVL: $${oracleData.tvl_usd.toLocaleString()}\n`;
      if (oracleData.audit_status !== 'unknown') {
        prompt += `- Audit status: ${oracleData.audit_status}`;
        if (oracleData.audit_provider) prompt += ` (by ${oracleData.audit_provider})`;
        prompt += `\n`;
      }
    }

    prompt += `\nUser level: ${userLevel}\n`;
    prompt += `\nProvide your analysis as a JSON object.`;

    return prompt;
  }

  private normalizeSeverity(severity: string): Severity {
    const s = severity.toLowerCase();
    if (s === 'critical') return 'critical';
    if (s === 'high') return 'high';
    if (s === 'medium') return 'medium';
    return 'low';
  }
}

// Mock LLM Service for fallback
export class MockLLMService implements LLMServiceInterface {
  async analyzeFindingsWithLLM(
    technicalFindings: DetectedVulnerability[],
    oracleData: OracleData | null,
    userLevel: UserLevel
  ): Promise<LLMAnalysisResult> {
    const criticalCount = technicalFindings.filter(
      (f) => f.severity === 'critical'
    ).length;
    const highCount = technicalFindings.filter(
      (f) => f.severity === 'high'
    ).length;
    const totalIssues = technicalFindings.length;

    let summary_short: string;
    if (criticalCount > 0) {
      summary_short = this.generateCriticalSummary(
        criticalCount,
        totalIssues,
        userLevel
      );
    } else if (highCount > 0) {
      summary_short = this.generateHighRiskSummary(
        highCount,
        totalIssues,
        userLevel
      );
    } else if (totalIssues > 0) {
      summary_short = this.generateMediumRiskSummary(totalIssues, userLevel);
    } else {
      summary_short = this.generateLowRiskSummary(userLevel);
    }

    if (oracleData) {
      summary_short += this.addOracleContext(oracleData, userLevel);
    }

    const key_findings: KeyFinding[] = technicalFindings
      .sort((a, b) => this.severityWeight(b.severity) - this.severityWeight(a.severity))
      .slice(0, 5)
      .map((finding) => ({
        title: finding.title,
        severity: finding.severity,
        description: this.simplifyDescription(finding.description, userLevel),
      }));

    if (key_findings.length === 0) {
      key_findings.push({
        title: 'No Critical Issues Found',
        severity: 'low' as Severity,
        description:
          userLevel === 'beginner'
            ? 'We did not find any major security problems in this contract.'
            : 'Static analysis did not detect critical vulnerabilities. Manual review recommended.',
      });
    }

    return {
      summary_short,
      key_findings,
      detailed_explanation: this.generateDetailedExplanation(
        technicalFindings,
        oracleData,
        userLevel
      ),
    };
  }

  private generateCriticalSummary(
    criticalCount: number,
    totalIssues: number,
    userLevel: UserLevel
  ): string {
    if (userLevel === 'beginner') {
      return `⚠️ WARNING: This contract has ${criticalCount} serious security problem${criticalCount > 1 ? 's' : ''} that could put your funds at risk. We strongly recommend NOT interacting with this contract.`;
    }
    return `Critical risk detected: ${criticalCount} critical and ${totalIssues - criticalCount} additional vulnerabilities identified. Exercise extreme caution.`;
  }

  private generateHighRiskSummary(
    highCount: number,
    totalIssues: number,
    userLevel: UserLevel
  ): string {
    if (userLevel === 'beginner') {
      return `⚠️ CAUTION: This contract has ${highCount} significant security concern${highCount > 1 ? 's' : ''}. Proceed with caution and consider the risks before interacting.`;
    }
    return `High risk: ${highCount} high-severity issues detected among ${totalIssues} total findings. Review carefully before proceeding.`;
  }

  private generateMediumRiskSummary(
    totalIssues: number,
    userLevel: UserLevel
  ): string {
    if (userLevel === 'beginner') {
      return `This contract has ${totalIssues} minor concern${totalIssues > 1 ? 's' : ''} worth noting. It appears relatively safe, but always do your own research.`;
    }
    return `Moderate risk: ${totalIssues} low-to-medium severity issues identified. Standard precautions advised.`;
  }

  private generateLowRiskSummary(userLevel: UserLevel): string {
    if (userLevel === 'beginner') {
      return `✅ This contract appears to be relatively safe based on our automated analysis. No major red flags detected, but always exercise caution with any smart contract.`;
    }
    return `Low risk: No significant vulnerabilities detected by static analysis. Note that this does not guarantee security - manual audit recommended for high-value interactions.`;
  }

  private addOracleContext(oracleData: OracleData, userLevel: UserLevel): string {
    const contexts: string[] = [];

    if (oracleData.age_days !== null) {
      if (oracleData.age_days < 7) {
        contexts.push(
          userLevel === 'beginner'
            ? 'This is a very new contract (less than a week old).'
            : `Contract age: ${oracleData.age_days} days (very new).`
        );
      } else if (oracleData.age_days > 365) {
        contexts.push(
          userLevel === 'beginner'
            ? 'This contract has been around for over a year.'
            : `Contract age: ${oracleData.age_days} days (established).`
        );
      }
    }

    if (oracleData.audit_status === 'audited') {
      contexts.push(
        userLevel === 'beginner'
          ? 'This contract has been professionally audited.'
          : `Audit status: Audited${oracleData.audit_provider ? ` by ${oracleData.audit_provider}` : ''}.`
      );
    }

    if (contexts.length > 0) {
      return ' ' + contexts.join(' ');
    }
    return '';
  }

  private simplifyDescription(description: string, userLevel: UserLevel): string {
    if (userLevel === 'beginner') {
      const simplifications: Record<string, string> = {
        'reentrancy': 'could allow attackers to drain funds by calling the contract multiple times',
        'delegatecall': 'allows running external code which could be dangerous',
        'selfdestruct': 'the contract can be permanently destroyed',
        'tx.origin': 'uses an unsafe way to check who is calling',
        'overflow': 'math operations could produce unexpected results',
      };

      for (const [term, simple] of Object.entries(simplifications)) {
        if (description.toLowerCase().includes(term)) {
          return simple.charAt(0).toUpperCase() + simple.slice(1) + '.';
        }
      }
    }
    return description;
  }

  private generateDetailedExplanation(
    findings: DetectedVulnerability[],
    oracleData: OracleData | null,
    userLevel: UserLevel
  ): string {
    let explanation = '';

    if (findings.length === 0) {
      explanation =
        'Our automated analysis did not detect any known vulnerability patterns in this contract. ';
      explanation +=
        'However, this does not guarantee the contract is completely safe. ';
      explanation +=
        'Smart contract security is complex, and new vulnerabilities are discovered regularly.';
    } else {
      explanation = `We identified ${findings.length} potential issue${findings.length > 1 ? 's' : ''} in this contract:\n\n`;

      for (const finding of findings) {
        explanation += `• ${finding.title} (${finding.severity.toUpperCase()}): `;
        explanation += `${finding.description}\n`;
        if (finding.fix_suggestion) {
          explanation += `  Recommendation: ${finding.fix_suggestion}\n`;
        }
        explanation += '\n';
      }
    }

    if (oracleData) {
      explanation += '\nOn-chain data analysis:\n';
      if (oracleData.age_days !== null) {
        explanation += `• Contract age: ${oracleData.age_days} days\n`;
      }
      if (oracleData.tx_count !== null) {
        explanation += `• Transaction count: ${oracleData.tx_count.toLocaleString()}\n`;
      }
      if (oracleData.holders_count !== null) {
        explanation += `• Holder count: ${oracleData.holders_count.toLocaleString()}\n`;
      }
      if (oracleData.audit_status !== 'unknown') {
        explanation += `• Audit status: ${oracleData.audit_status}\n`;
      }
    }

    return explanation;
  }

  private severityWeight(severity: Severity): number {
    switch (severity) {
      case 'critical':
        return 4;
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
    }
  }
}

// Use OpenAI service if API key is available, otherwise fall back to mock
export const llmService = process.env.OPENAI_API_KEY 
  ? new OpenAILLMService() 
  : new MockLLMService();

console.log(`🤖 LLM Service: ${process.env.OPENAI_API_KEY ? 'OpenAI GPT-4o-mini' : 'Mock (no API key)'}`);
