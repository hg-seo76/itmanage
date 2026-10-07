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
2. [★가장 중요★ 자산번호(assetId)]:
   - 학교 물품관리에서 가장 핵심인 고유 식별자는 "M0000" (또는 "m0000", 소문자 포함)으로 시작하는 번호(예: M000004435, M000000009 등)입니다.
   - 사진 전체에서 'M' 뒤에 0이 여러 개 이어지는 M0000 형태의 자산번호를 집중 탐색하여 반드시 추출하세요!
   - RFID 슬래시 항목(예: KKR-... / MO00004435 / 급식실)이나 '고유번호', '물품번호', 바코드 밑에 인쇄된 M번호를 샅샅이 확인하세요.
   - 알파벳 'O', 'o', 'D', 'Q'가 숫자 '0'(영)으로 잘못 읽히기 쉬우므로, M 뒤의 연속 문자는 숫자 0으로 교정하여 반드시 완전한 "M0000..." 형식으로 만드세요.
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
            // M0000 자산번호 대소문자 및 O->0 집중 정규화
            if (parsed.assetId) {
              parsed.assetId = String(parsed.assetId).trim().toUpperCase().replace(/^M[O0ODQ\d\s-]+/i, (m: string) => {
                return 'M' + m.slice(1).replace(/[\s-]/g, '').replace(/[ODQo]/gi, '0');
              });
            }
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
    // 2차 시도: Google Cloud Vision API (DOCUMENT_TEXT_DETECTION + TEXT_DETECTION) Fallback
    // 라벨/스티커 등 문서 및 소형 글자에 특화된 DOCUMENT_TEXT_DETECTION 우선 적용
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
                type: 'DOCUMENT_TEXT_DETECTION',
              },
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

    // 인식된 전체 텍스트 추출 (fullTextAnnotation 우선 추출로 고밀도 라벨 인식)
    const fullTextAnnotation = visionData.responses?.[0]?.fullTextAnnotation;
    const textAnnotations = visionData.responses?.[0]?.textAnnotations;
    const fullText = fullTextAnnotation?.text || (textAnnotations && textAnnotations.length > 0 ? textAnnotations[0].description : '');

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
