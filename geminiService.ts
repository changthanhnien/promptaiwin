import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FeatureId, ToneId, AnalysisResult } from "../types";

const mapToneToPrompt = (tone: ToneId): string => {
  switch (tone) {
    case ToneId.HUMOROUS: return "Hài hước, vui nhộn, dùng tiếng lóng Gen Z, teencode nếu phù hợp, tạo cảm giác giải trí.";
    case ToneId.EXPERT: return "Chuyên nghiệp, phân tích sâu sắc, dùng thuật ngữ chuyên ngành marketing/film, khách quan.";
    case ToneId.FRIENDLY: return "Thân thiện, thủ thỉ tâm tình, như người bạn đang chia sẻ kinh nghiệm, dùng từ ngữ ấm áp.";
    case ToneId.EMOTIONAL: return "Đầy cảm xúc, chạm đến nỗi đau (pain point) hoặc khát khao của người xem, storytelling dẫn dắt.";
    case ToneId.SARCASTIC: return "Châm biếm, sắc sảo, xéo xắt, dùng ngôn từ mạnh, 'thô nhưng thật'.";
    case ToneId.CONCISE: return "Ngắn gọn, súc tích, gạch đầu dòng rõ ràng, đi thẳng vào vấn đề, không lan man.";
    case ToneId.SEXY_GIRL: return "Quyến rũ, lôi cuốn, giọng điệu ngọt ngào pha chút bí ẩn, tự tin (baddie/slay vibe), dùng từ ngữ gợi cảm xúc, phù hợp với content beauty/fashion hoặc lifestyle sang chảnh.";
    case ToneId.CUTE_HEARTWARMING: return "Ngọt ngào, đáng yêu, mang lại cảm giác chữa lành (healing). Tập trung mô tả sự ngây thơ, mềm mại (fluffy), ánh sáng trong trẻo (pastel/soft lighting) và các khoảnh khắc tương tác 'tan chảy' tim người xem. Phù hợp nhất cho content Em bé & Thú cưng.";
    case ToneId.STREET_FASHION: return "Năng động, Cool ngầu, đậm chất Streetwear. Tập trung tối đa vào Review chi tiết chất vải (fabric), cận cảnh hình in, form dáng (fit/oversized) và gợi ý phối đồ (Mix & match/OOTD). Ngôn ngữ trendy, gãy gọn, dùng thuật ngữ thời trang (gsm, bo cổ, đứng form), phù hợp bán hàng Local Brand, T-shirt, Hoodie.";
    case ToneId.GIFT_FAMILY: return "Ấm áp, Trân trọng, Tinh tế. Tập trung khai thác ý nghĩa món quà (meaningful), cảm xúc vỡ òa khi nhận quà (Unboxing reaction) và thông điệp yêu thương gửi tới người thân. Highlight được vẻ đẹp thẩm mỹ của bao bì/sản phẩm (gift set). Ngôn ngữ chân thành, xúc động nhưng vẫn vui tươi, bắt trend quà tặng dịp lễ/tết.";
    default: return "Trung lập, rõ ràng.";
  }
};

const mapFeatureToInstruction = (feature: FeatureId): string => {
  switch (feature) {
    case FeatureId.CREATE_AI_PROMPT:
      return `
        MỤC TIÊU: Tạo bộ Prompt cực kỳ chi tiết (Tiếng Anh & Tiếng Việt) để tái tạo video này bằng các công cụ AI Video đỉnh cao (Veo, Sora, Kling).
        
        QUY TẮC PHÂN CẢNH (BẮT BUỘC):
        1. SHOT-BY-SHOT: Phải tách video thành từng cảnh quay nhỏ (Shot). Mỗi khi thay đổi góc máy, bối cảnh, hoặc hành động quan trọng, BẮT BUỘC tạo một segment mới.
        2. NHỊP ĐỘ: Mỗi segment chỉ nên dài từ 2-5 giây để đảm bảo độ chính xác cho AI Video Engine.
        
        YÊU CẦU NỘI DUNG (MỚI - QUAN TRỌNG):
        3. VOICE NGƯỜI NÓI: Bạn PHẢI trích xuất và đưa vào phần audio. 
           - YÊU CẦU: Phải giữ đúng NGÔN NGỮ GỐC của người nói (nói tiếng Việt ghi tiếng Việt, nói tiếng Anh ghi tiếng Anh).
        4. HỆ THỐNG ÂM THANH: Thêm mô tả chi tiết về Sound Effects (SFX) như tiếng gió, tiếng chân, tiếng va chạm... và nhạc nền (BGM) phù hợp với mood của cảnh.
        5. TỐI ƯU VISUAL PROMPT: Mô tả visual theo công thức: [Subject] + [Action] + [Camera Movement] + [Lighting/Atmosphere]. 
           - TUYỆT ĐỐI KHÔNG để bất kỳ TEXT (chữ viết, captions, subtitles) nào xuất hiện trên màn hình trong prompt visual.
        
        CẤU TRÚC JSON:
        - title: Tiêu đề video.
        - summary: Master Prompt (English) - Tổng quan toàn bộ video cho AI Video Engine.
        - segments:
          + time: Mốc thời gian (VD: 00:00 - 00:03).
          + visual: MÔ TẢ CẢNH (Tiếng Việt) - Chi tiết hình ảnh, ánh sáng, góc máy. KHÔNG CHỨA TEXT.
          + audio: VOICE & SOUNDS (Ngôn ngữ gốc) - Lời thoại gốc + SFX + BGM.
          + analysis: AI VIDEO PROMPT (English) - Prompt kỹ thuật chi tiết để dán vào công cụ tạo video. KHÔNG CHỨA TEXT.
      `;
    case FeatureId.EXTRACT_SCRIPT:
      return `
        MỤC TIÊU: Trích xuất CHÍNH XÁC từng câu thoại (verbatim).
        
        QUY TẮC:
        1. TÁCH DÒNG: Mỗi câu nói hoặc cụm từ trọn vẹn phải là một segment riêng. Không gộp thành đoạn văn.
        2. THỜI GIAN: Gắn mốc thời gian chính xác cho từng câu nói.
        
        CẤU TRÚC JSON:
        - title: Tiêu đề.
        - summary: Tóm tắt nội dung chính.
        - segments: Danh sách câu thoại.
          + time: Mốc thời gian (VD: 00:01 - 00:05).
          + audio: Ghi lại chính xác lời thoại tiếng Việt.
          + visual: Mô tả ngắn gọn người nói hoặc text trên màn hình.
          + analysis: Nhận xét về ngữ điệu (Tone) của câu nói đó.
      `;
    case FeatureId.DEEP_ANALYSIS:
      return `
        MỤC TIÊU: Phân tích sâu chiến lược video.
        
        QUY TẮC: Chia video theo cấu trúc kịch bản (Hook, Problem, Solution, CTA). Không gộp chung.
        
        CẤU TRÚC JSON:
        - segments: Chia theo cấu trúc:
          + time: Mốc thời gian.
          + visual: Yếu tố thị giác giữ chân người xem.
          + audio: Tóm tắt nội dung.
          + analysis: Tại sao đoạn này viral? (Phân tích tâm lý/kỹ thuật).
      `;
    case FeatureId.AUDIT_THUMBNAIL:
      return `
        MỤC TIÊU: Đánh giá CTR.
        CẤU TRÚC JSON:
        - segments: Chia thành các tiêu chí (Màu sắc, Text, Cảm xúc, Bố cục).
          + time: Tên tiêu chí.
          + visual: Mô tả hiện trạng.
          + audio: N/A.
          + analysis: Đánh giá điểm mạnh/yếu và giải pháp cải thiện.
      `;
    case FeatureId.REMAKE_POST:
      return `
        MỤC TIÊU: Viết bài đăng MXH.
        CẤU TRÚC JSON:
        - segments: Chia thành 3 phần: Mở bài (Hook), Thân bài (Value), Kết bài (CTA).
          + time: Tên phần (Mở/Thân/Kết).
          + audio: Nội dung text hoàn chỉnh của đoạn đó.
          + visual: Gợi ý ảnh minh họa.
          + analysis: Giải thích kỹ thuật copywriting đã dùng.
      `;
    case FeatureId.REMAKE_SCRIPT:
      return `
        MỤC TIÊU: Viết kịch bản Remake.
        QUY TẮC: Phải chia nhỏ từng cảnh quay (Scene) để người quay phim dễ hiểu.
        CẤU TRÚC JSON:
        - segments: Các phân cảnh kịch bản chi tiết.
          + time: Thời gian dự kiến.
          + visual: Chỉ đạo quay phim (Góc máy, hành động).
          + audio: Lời thoại nhân vật.
          + analysis: Ghi chú đạo diễn.
      `;
    case FeatureId.TIKTOK_SCRIPT:
      return `
        MỤC TIÊU: Kịch bản TikTok nhanh.
        QUY TẮC: Chia nhỏ từng giây (0-3s, 3-10s...). Nhịp độ nhanh.
        CẤU TRÚC JSON:
        - segments: Từng giây quan trọng.
          + time: Mốc thời gian.
          + visual: Text overlay & Hiệu ứng.
          + audio: Lời thoại.
          + analysis: Lý do giữ chân người xem.
      `;
    default:
      return "Phân tích video chi tiết, chia nhỏ thành nhiều segments.";
  }
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Tiêu đề hoặc chủ đề chính" },
    summary: { type: Type.STRING, description: "Tóm tắt hoặc nội dung tổng quan" },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          time: { type: Type.STRING, description: "Thời gian hoặc tên phần" },
          visual: { type: Type.STRING, description: "Mô tả hình ảnh" },
          audio: { type: Type.STRING, description: "Nội dung lời thoại hoặc văn bản chính" },
          analysis: { type: Type.STRING, description: "Phân tích hoặc ghi chú" },
        },
        required: ["time", "visual", "audio", "analysis"]
      }
    }
  },
  required: ["title", "summary", "segments"]
};

// String representation of schema for prompt injection when using tools
const jsonStructurePrompt = `
STRICT OUTPUT FORMAT:
You MUST return ONLY a valid JSON object. Do not add any markdown formatting (like \`\`\`json) or conversational text.
Structure:
{
  "title": "string",
  "summary": "string",
  "segments": [
    {
      "time": "string",
      "visual": "string",
      "audio": "string",
      "analysis": "string"
    }
  ]
}
`;

function extractJSON(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  
  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
  return text; // Return original if pattern not found, hopefully it's valid JSON
}

export const analyzeVideo = async (
  fileBase64: string | null,
  mimeType: string | null,
  url: string,
  feature: FeatureId,
  tone: ToneId,
  customPrompt: string
): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set it in process.env.API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = "gemini-2.5-flash"; 

  const featureInstruction = mapFeatureToInstruction(feature);
  const toneInstruction = mapToneToPrompt(tone);
  const isUrlMode = !!url && !fileBase64;

  let systemInstruction = `
    Bạn là một chuyên gia Viral Video Marketing, Content Creator và Scriptwriter hàng đầu.
    Nhiệm vụ của bạn là thực hiện yêu cầu sau đây với chất lượng cao nhất.
    
    YÊU CẦU CHỨC NĂNG:
    ${featureInstruction}

    PHONG CÁCH / TONE MOOD:
    ${toneInstruction}
    
    YÊU CẦU TÙY CHỈNH TỪ NGƯỜI DÙNG:
    "${customPrompt || "Không có yêu cầu thêm"}"

    LƯU Ý QUAN TRỌNG:
    - Ngôn ngữ trả về: Tiếng Việt (Trừ khi tính năng yêu cầu tiếng Anh như Prompt AI).
    - Với tính năng "Trích Xuất Script", độ chính xác của lời thoại là ưu tiên số 1.
    - QUAN TRỌNG: Phải chia nhỏ nội dung thành nhiều segments (phân cảnh) trong mảng JSON 'segments'. KHÔNG ĐƯỢC trả về mảng chỉ có 1 phần tử trừ khi video cực ngắn (< 3 giây).
  `;

  if (isUrlMode) {
    systemInstruction += `\n
    OUTPUT FORMAT RULE:
    You are using a search tool.
    Output MUST be a single valid JSON string.
    ${jsonStructurePrompt}
    `;
  } else {
    systemInstruction += `\nOutput phải là JSON hợp lệ theo Schema đã định nghĩa.`;
  }

  const parts: any[] = [];

  if (fileBase64 && mimeType) {
    parts.push({
      inlineData: {
        data: fileBase64,
        mimeType: mimeType
      }
    });
    parts.push({
      text: "Hãy xử lý video này theo yêu cầu trên. Hãy xem kỹ từng giây để phân tách chính xác."
    });
  } else if (url) {
    parts.push({
      text: `Phân tích video từ đường dẫn: ${url}.
      
      QUAN TRỌNG - QUY TRÌNH XỬ LÝ LINK:
      1. Sử dụng Google Search để tìm kiếm chính xác tiêu đề, nội dung, transcript hoặc bài viết tóm tắt về video này.
      2. Dựa trên kết quả tìm kiếm thực tế, hãy điền thông tin vào JSON.
      3. TUYỆT ĐỐI KHÔNG BỊA ĐẶT (HALLUCINATE). Nếu Google Search không trả về thông tin cụ thể về nội dung video này (do video mới, ít view, hoặc chưa được index), hãy trả về JSON với nội dung báo lỗi như sau:
         - title: "Không tìm thấy dữ liệu video"
         - summary: "Hệ thống AI không tìm thấy thông tin chi tiết (transcript/nội dung) của link video này trên Google Search. Điều này thường xảy ra với video TikTok/Shorts mới hoặc chưa được index công khai. Vui lòng tải file video trực tiếp lên để AI có thể 'xem' và phân tích chính xác từng khung hình."
         - segments: Tạo một segment duy nhất với nội dung "Vui lòng sử dụng tính năng Tải File (Upload Video) để phân tích."
      4. KHÔNG tự ý sáng tạo ra một kịch bản video viral mẫu nếu không tìm thấy video gốc.
      5. Nếu tìm thấy nội dung, hãy cố gắng tái tạo cấu trúc từng phân cảnh dựa trên mô tả tìm được.`
    });
  } else {
    throw new Error("Vui lòng cung cấp file video hoặc link.");
  }

  try {
    const requestConfig: any = {
      systemInstruction: systemInstruction,
      temperature: 0.2, // Reduced temperature for strict adherence to facts
    };

    if (isUrlMode) {
      // When using tools (Search), we cannot set responseSchema or responseMimeType
      requestConfig.tools = [{ googleSearch: {} }];
    } else {
      // When using Video File, we use strict JSON mode
      requestConfig.responseMimeType = "application/json";
      requestConfig.responseSchema = responseSchema;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        role: "user",
        parts: parts
      },
      config: requestConfig
    });

    if (response.text) {
      const rawText = response.text;
      const jsonStr = extractJSON(rawText);

      try {
        const result = JSON.parse(jsonStr) as AnalysisResult;

        // Extract grounding metadata if available (for Search mode)
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
          result.sources = groundingChunks
            .map((chunk: any) => ({
              title: chunk.web?.title || 'Web Source',
              uri: chunk.web?.uri || ''
            }))
            .filter((s: any) => s.uri); // Filter out empty URIs
        }

        return result;
      } catch (e) {
        console.error("JSON Parse Error:", e);
        console.log("Raw Response:", rawText);
        console.log("Extracted JSON:", jsonStr);
        throw new Error("AI trả về định dạng không xử lý được. Vui lòng thử lại với video khác.");
      }
    } else {
      throw new Error("No response from AI");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};