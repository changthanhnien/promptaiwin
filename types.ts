export enum InputMode {
  LINK = 'LINK',
  FILE = 'FILE',
}

export enum FeatureId {
  CREATE_AI_PROMPT = 'create_ai_prompt',
  EXTRACT_SCRIPT = 'extract_script',
  DEEP_ANALYSIS = 'deep_analysis',
  AUDIT_THUMBNAIL = 'audit_thumbnail',
  REMAKE_POST = 'remake_post',
  REMAKE_SCRIPT = 'remake_script',
  TIKTOK_SCRIPT = 'tiktok_script',
}

export enum ToneId {
  HUMOROUS = 'humorous',
  EXPERT = 'expert',
  FRIENDLY = 'friendly',
  EMOTIONAL = 'emotional',
  SARCASTIC = 'sarcastic',
  CONCISE = 'concise',
  SEXY_GIRL = 'sexy_girl',
  CUTE_HEARTWARMING = 'cute_heartwarming',
  STREET_FASHION = 'street_fashion',
  GIFT_FAMILY = 'gift_family',
}

export interface AnalysisSegment {
  time: string;
  visual: string;
  audio: string;
  analysis: string;
}

export interface Source {
  title: string;
  uri: string;
}

export interface AnalysisResult {
  title: string;
  summary: string;
  segments: AnalysisSegment[];
  sources?: Source[];
}

export interface Feature {
  id: FeatureId;
  icon: any; // Lucide icon component type
  title: string;
  description: string;
}

export interface Tone {
  id: ToneId;
  label: string;
}