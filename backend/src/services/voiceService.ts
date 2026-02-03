import { RiskLevel } from '../models/types';

export interface VoiceSummaryResult {
  audio_url: string;
}

export interface VoiceServiceInterface {
  generateVoiceSummary(
    text: string,
    riskLevel: RiskLevel
  ): Promise<VoiceSummaryResult>;
}

export class MockVoiceService implements VoiceServiceInterface {
  async generateVoiceSummary(
    text: string,
    riskLevel: RiskLevel
  ): Promise<VoiceSummaryResult> {
    const voiceId = this.selectVoiceForRisk(riskLevel);
    const audioUrl = `https://api.legalchain.example/audio/mock-${voiceId}-${Date.now()}.mp3`;

    console.log(`[MockVoiceService] Would generate voice with:`);
    console.log(`  - Voice ID: ${voiceId}`);
    console.log(`  - Risk Level: ${riskLevel}`);
    console.log(`  - Text length: ${text.length} characters`);
    console.log(`  - Text preview: ${text.substring(0, 100)}...`);

    return {
      audio_url: audioUrl,
    };
  }

  private selectVoiceForRisk(riskLevel: RiskLevel): string {
    switch (riskLevel) {
      case 'low':
        return 'adam-calm';
      case 'medium':
        return 'adam-informative';
      case 'high':
        return 'rachel-urgent';
      case 'dangerous':
        return 'rachel-serious';
    }
  }
}

export class ElevenLabsVoiceService implements VoiceServiceInterface {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateVoiceSummary(
    text: string,
    riskLevel: RiskLevel
  ): Promise<VoiceSummaryResult> {
    const voiceId = this.getVoiceId(riskLevel);
    const stability = riskLevel === 'dangerous' ? 0.8 : 0.5;
    const similarityBoost = 0.75;

    console.log(`[ElevenLabsVoiceService] Generating voice summary...`);
    console.log(`  - Voice ID: ${voiceId}`);
    console.log(`  - Risk Level: ${riskLevel}`);

    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability,
              similarity_boost: similarityBoost,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioUrl = `https://api.legalchain.example/audio/elevenlabs-${Date.now()}.mp3`;

      return { audio_url: audioUrl };
    } catch (error) {
      console.error('[ElevenLabsVoiceService] Error:', error);
      throw error;
    }
  }

  private getVoiceId(riskLevel: RiskLevel): string {
    switch (riskLevel) {
      case 'low':
      case 'medium':
        return 'pNInz6obpgDQGcFmaJgB';
      case 'high':
      case 'dangerous':
        return '21m00Tcm4TlvDq8ikWAM';
    }
  }
}

export function createVoiceService(): VoiceServiceInterface {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (apiKey && apiKey !== 'YOUR_ELEVENLABS_API_KEY') {
    return new ElevenLabsVoiceService(apiKey);
  }
  return new MockVoiceService();
}

export const voiceService = createVoiceService();
