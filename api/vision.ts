export const config = {
  runtime: 'edge', // Edge 런타임으로 빠르고 가볍게 실행 (선택 사항)
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Missing imageBase64 in request body' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GOOGLE_VISION_API_KEY is not configured on the server' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ─────────────────────────────────────────────
    // 1차 시도: Gemini Multimodal Vision AI 직접 분석
    // 사진을 사람처럼 이해하여 다중 스티커(선장초 우선), 표 레이아웃, 오탈자를 100% 정밀 구조화
    // ─────────────────────────────────────────────
    const geminiPrompt = `학교 정보화기기(컴퓨터, 모니터, 노트북, 태블릿, 프린터 등)의 물품 자산 스티커/RFID 태그 사진입니다.
다음 규칙에 따라 정확하게 정보를 분석하여 반드시 순수 JSON 객체 하나만 반환하세요:
1. 기기에 이전 학교(예: 아산공수초등학교 등) 스티커와 현재 학교(선장초등학교 또는 충남교육청 KKR- RFID 태그) 스티커가 함께 붙어있다면, 반드시 현재 관리 주체인 "선장초등학교" 및 "KKR-로 시작하는 RFID 태그"의 정보를 최우선으로 추출하세요.
2. 자산번호(assetId): "M"으로 시작하는 고유 자산번호 (예: M000004435, M000000009). KKR- 슬래시 항목(예: KKR-... / MO00004435 / 급식실)에 포함된 M번호를 최우선으로 하되 알파벳 O는 숫자 0으로 교정하세요.
3. 품명(name): 데스크톱컴퓨터, 액정모니터, 노트북, 태블릿, 프린터, 디지털카메라 등
4. 기기 구분(category): 'desktop_pc' | 'monitors' | 'smart_laptop' | 'teacher_laptop' | 'smart_tablet' | 'printer' | 'digital_camera' | 'network_ap' | 'server' | 'etc' 중 하나
5. 제조사(manufacturer): 삼보컴퓨터, 삼성전자, LG전자, 다나와컴퓨터, HP, Lenovo 등
6. 모델명(modelName): DT166-G671-OU01, SDM-24LEDJH 등 규격의 세부 모델명
7. 취득연도(acquisitionYear): 4자리 숫자 (예: 2017)
8. 취득월(acquisitionMonth): 1~12 숫자 (예: 3)
9. 배치위치(location): 행정실, 교무실, 급식실, 과학실 등 비고나 설치장소에 기재된 위치
10. 취득단가(price): 콤마 포함 금액 (예: "1,115,690")
11. 분류번호(classificationNo): 43211507-23013456 형식

반드시 다음 JSON 형식으로만 응답하세요:
{
  "assetId": "M000004435",
  "name": "데스크톱컴퓨터",
  "category": "desktop_pc",
  "manufacturer": "삼보컴퓨터",
  "modelName": "DT166-G671-OU01",
  "acquisitionYear": 2017,
  "acquisitionMonth": 3,
  "location": "급식실",
  "price": "1,115,690",
  "classificationNo": "43211507-23013456"
}`;

    try {
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const geminiResponse = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: geminiPrompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: 'application/json',
          },
        }),
      });

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const cleanJson = candidateText.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed && (parsed.assetId || parsed.name || parsed.modelName || parsed.manufacturer)) {
            return new Response(JSON.stringify({ parsed, source: 'gemini-vision' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
      }
    } catch (geminiErr) {
      console.warn('Gemini Vision fallback to Google Cloud Vision API:', geminiErr);
    }

    // ─────────────────────────────────────────────
    // 2차 시도: Google Cloud Vision API (TEXT_DETECTION) Fallback
    // ─────────────────────────────────────────────
    const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: imageBase64,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
              },
            ],
            imageContext: {
              languageHints: ['ko', 'en'], // 한글, 영문 위주 인식
            }
          },
        ],
      }),
    });

    const visionData = await visionResponse.json();

    if (!visionResponse.ok || visionData.error) {
      console.error('Google Vision API Error:', visionData.error);
      return new Response(JSON.stringify({ error: visionData.error?.message || 'Vision API failed' }), {
        status: visionResponse.status || 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 인식된 전체 텍스트 추출
    const textAnnotations = visionData.responses?.[0]?.textAnnotations;
    const fullText = textAnnotations && textAnnotations.length > 0 ? textAnnotations[0].description : '';

    return new Response(JSON.stringify({ text: fullText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
