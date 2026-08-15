import type { ImageEffort, ImageResolution } from '../../core/contracts/types'

export interface GoogleImageRequest {
  apiKey: string
  modelId: string
  systemInstruction: string
  userPrompt: string
  effort: ImageEffort
  resolution: ImageResolution
  aspectRatio: '1:1'
}

interface ImagePart {
  inlineData?: { data?: string; mimeType?: string }
  inline_data?: { data?: string; mime_type?: string }
}

interface ImageResponse {
  candidates?: Array<{ content?: { parts?: ImagePart[] } }>
  error?: { message?: string }
}

function extractImageData(payload: ImageResponse): string | null {
  const parts = payload.candidates?.flatMap((candidate) => candidate.content?.parts ?? []) ?? []
  for (const part of parts) {
    const data = part.inlineData?.data ?? part.inline_data?.data
    if (data) {
      const mimeType = part.inlineData?.mimeType ?? part.inline_data?.mime_type ?? 'image/png'
      return `data:${mimeType};base64,${data}`
    }
  }
  return null
}

export async function generateGoogleImage(request: GoogleImageRequest): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(request.modelId)}:generateContent?key=${encodeURIComponent(request.apiKey)}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: request.systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: request.userPrompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        thinkingConfig: { thinkingLevel: request.effort },
        imageConfig: { aspectRatio: request.aspectRatio, imageSize: request.resolution },
      },
    }),
  })
  const payload = await response.json() as ImageResponse
  if (!response.ok) throw new Error(payload.error?.message ?? `The image request failed (${response.status}).`)
  const imageData = extractImageData(payload)
  if (!imageData) throw new Error('The model returned no inline image. Check the selected model and API access.')
  return imageData
}
