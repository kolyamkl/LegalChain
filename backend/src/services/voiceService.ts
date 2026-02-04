import { RiskLevel } from '../models/types';

export interface VoiceSummaryResult {
  audio_url: string;
  audio_base64?: string; // Base64 encoded audio for direct embedding
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

    console.log(`[MockVoiceService] Would generate voice with:`);
    console.log(`  - Voice ID: ${voiceId}`);
    console.log(`  - Risk Level: ${riskLevel}`);
    console.log(`  - Text length: ${text.length} characters`);
    console.log(`  - Text preview: ${text.substring(0, 100)}...`);

    return {
      audio_url: '', // No audio in mock mode
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
    const stability = riskLevel === 'dangerous' || riskLevel === 'high' ? 0.7 : 0.5;
    const similarityBoost = 0.75;

    console.log(`[ElevenLabsVoiceService] Generating voice summary...`);
    console.log(`  - Voice ID: ${voiceId}`);
    console.log(`  - Risk Level: ${riskLevel}`);
    console.log(`  - Text length: ${text.length} characters`);

    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: text.substring(0, 5000), // ElevenLabs has text limits
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability,
              similarity_boost: similarityBoost,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ElevenLabsVoiceService] API error: ${response.status}`, errorText);
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      // Get audio as array buffer and convert to base64
      const audioBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;

      console.log(`[ElevenLabsVoiceService] ✅ Generated ${Math.round(audioBuffer.byteLength / 1024)}KB audio`);

      return { 
        audio_url: audioDataUrl,
        audio_base64: audioBase64,
      };
    } catch (error) {
      console.error('[ElevenLabsVoiceService] Error:', error);
      // Return empty audio on error rather than failing entire analysis
      return {
        audio_url: '',
      };
    }
  }

  private getVoiceId(riskLevel: RiskLevel): string {
    // ElevenLabs voice IDs:
    // Adam (calm, professional): pNInz6obpgDQGcFmaJgB
    // Rachel (clear, engaging): 21m00Tcm4TlvDq8ikWAM
    // Bella (friendly): EXAVITQu4vr4xnSDxMaL
    // Antoni (warm): ErXwobaYiN019PkySvjV
    switch (riskLevel) {
      case 'low':
        return 'pNInz6obpgDQGcFmaJgB'; // Adam - calm
      case 'medium':
        return 'ErXwobaYiN019PkySvjV'; // Antoni - warm/informative
      case 'high':
        return '21m00Tcm4TlvDq8ikWAM'; // Rachel - clear, more urgent
      case 'dangerous':
        return '21m00Tcm4TlvDq8ikWAM'; // Rachel - clear for serious warnings
    }
  }
}

export function createVoiceService(): VoiceServiceInterface {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (apiKey && apiKey !== 'YOUR_ELEVENLABS_API_KEY') {
    console.log('🎙️  Voice Service: ElevenLabs (real audio)');
    return new ElevenLabsVoiceService(apiKey);
  }
  console.log('🎙️  Voice Service: Mock (no audio)');
  return new MockVoiceService();
}

export const voiceService = createVoiceService();
