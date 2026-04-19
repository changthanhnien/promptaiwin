import { 
  FileText, 
  ScanEye, 
  Image as ImageIcon, 
  RefreshCw, 
  PenTool, 
  Video,
  Clapperboard
} from 'lucide-react';
import { Feature, FeatureId, Tone, ToneId } from './types';

export const FEATURES: Feature[] = [
  {
    id: FeatureId.CREATE_AI_PROMPT,
    icon: Clapperboard,
    title: "Tạo Prompt Video AI",
    description: "Tạo prompt (Anh/Việt) cho Veo, Sora, Kling từ video gốc."
  },
  {
    id: FeatureId.DEEP_ANALYSIS,
    icon: ScanEye,
    title: "Phân Tích Sâu",
    description: "Lời thoại, hình ảnh & nội dung từng đoạn."
  },
  {
    id: FeatureId.EXTRACT_SCRIPT,
    icon: FileText,
    title: "Trích Xuất Script",
    description: "Chép lại lời thoại chi tiết từ video."
  },
  {
    id: FeatureId.AUDIT_THUMBNAIL,
    icon: ImageIcon,
    title: "Audit Thumbnail",
    description: "Đánh giá màu sắc, text & độ thu hút."
  },
  {
    id: FeatureId.REMAKE_POST,
    icon: PenTool,
    title: "Remake Bài Viết",
    description: "Paste text/link hoặc ảnh -> Tự viết lại bài mới."
  },
  {
    id: FeatureId.REMAKE_SCRIPT,
    icon: RefreshCw,
    title: "Remake Kịch Bản",
    description: "Viết lại script hài hước cho kênh của bạn."
  },
  {
    id: FeatureId.TIKTOK_SCRIPT,
    icon: Video,
    title: "Tạo Script TikTok",
    description: "Từ ý tưởng -> Kịch bản viral hoàn chỉnh."
  }
];

export const TONES: Tone[] = [
  { id: ToneId.HUMOROUS, label: "Hài hước & Lầy lội" },
  { id: ToneId.EXPERT, label: "Chuyên gia & Nghiêm túc" },
  { id: ToneId.FRIENDLY, label: "Thân thiện & Gần gũi" },
  { id: ToneId.EMOTIONAL, label: "Cảm xúc & Kể chuyện" },
  { id: ToneId.SARCASTIC, label: "Xéo xắt & Drama" },
  { id: ToneId.CONCISE, label: "Ngắn gọn & Súc tích" },
  { id: ToneId.SEXY_GIRL, label: "Sexy Girl & Quyến rũ" },
  { id: ToneId.CUTE_HEARTWARMING, label: "Dễ thương & Chữa lành" },
  { id: ToneId.STREET_FASHION, label: "Street Style & Review Fashion" },
  { id: ToneId.GIFT_FAMILY, label: "Quà Tặng & Gia Đình" },
];