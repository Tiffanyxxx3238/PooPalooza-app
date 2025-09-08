export interface PoopEntry {
  id?: string;
  user_id: number;
  date: string; // 用於前端顯示與 streak 計算（來自 record_time）
  color: string;
  consistency: string;
  volume: string;
  odor?: string;
  has_blood?: boolean;
  has_mucus?: boolean;
  image_url?: string;
  ai_poop_type?: string;
  ai_poop_color?: string;
  ai_poop_volume?: string;
  ai_diagnosis_summary?: string;
  health_recommendations?: string;
  health_indicators?: string;
  duration?: number; 
}