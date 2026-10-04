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

    // Google Cloud Vision API 호출 (TEXT_DETECTION)
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
