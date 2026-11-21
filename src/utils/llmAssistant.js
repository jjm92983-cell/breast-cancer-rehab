import alertRules from '../config/alertRules.json'
import exerciseData from '../data/exercises.json'
import { evaluateAlerts } from './alertEvaluator'
import { getTodayDateString } from './storage'

// 채팅창 바로 위에 제시할 추천 프롬프트 3가지입니다.
export const RECOMMENDED_PROMPTS = [
  '오늘 내 기록 기준으로 주의할 점이 있을까?',
  '지금 내 단계에서 할 수 있는 재활운동 알려줘',
  '병원 내원 시 의료진에게 무엇을 전달하면 좋을까?',
]

const GEMINI_KEY_STORAGE = 'rehab_app_gemini_api_key'

export function getSavedGeminiApiKey() {
  try {
    return localStorage.getItem(GEMINI_KEY_STORAGE) || import.meta.env.VITE_GEMINI_API_KEY || ''
  } catch {
    return import.meta.env.VITE_GEMINI_API_KEY || ''
  }
}

export function saveGeminiApiKey(key) {
  try {
    if (key && key.trim()) {
      localStorage.setItem(GEMINI_KEY_STORAGE, key.trim())
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE)
    }
  } catch (e) {
    console.error('API 키 저장 오류:', e)
  }
}

// 현재 브라우저에 저장된 환자의 기록·운동·위험신호 상태를 AI가 참고할 수 있게 요약합니다.
function buildPatientContextText(appData) {
  const today = getTodayDateString()
  const allowedStage = appData.allowedStage || 1
  const sortedRecords = [...(appData.records || [])].sort((a, b) =>
    a.date.localeCompare(b.date)
  )
  const latestRecord = sortedRecords[sortedRecords.length - 1] || null
  const recent7 = sortedRecords.slice(-7)
  const alertStatus = evaluateAlerts(sortedRecords, alertRules)

  const allowedExercises = exerciseData.exercises.filter(
    (ex) => ex.stage <= allowedStage
  )
  const todayCompletedIds = appData.completedExercisesByDate?.[today] || []
  const completedCount = allowedExercises.filter((ex) =>
    todayCompletedIds.includes(ex.id)
  ).length

  return JSON.stringify({
    today,
    patientSummary: appData.patientProfile?.summary || '유방암 수술 후 회복 중인 사용자',
    allowedStage: `${allowedStage}단계`,
    todayExerciseProgress: `${completedCount}/${allowedExercises.length}개 완료`,
    allowedExercises: allowedExercises.map((e) => ({
      stage: e.stage,
      name: e.name,
      reps: e.reps,
      method: e.method,
    })),
    latestRecord,
    recent7DaysSummary: recent7.map((r) => ({
      date: r.date,
      pain: r.pain,
      temperature: r.temperature,
      armSwelling: r.armSwelling,
      shoulderMobility: r.shoulderMobility,
      exerciseCompletionRate: r.exerciseCompletionRate,
    })),
    alertStatus: {
      hasAlert: alertStatus.hasAlert,
      highestLevel: alertStatus.highestLevel,
      primaryMessage: alertStatus.primaryMessage,
      matchedAlerts: alertStatus.matchedAlerts,
    },
  })
}

// 시스템 지시문: 건강/재활 질문에는 앱 기록을 반영해 답하고, 일상/비건강 질문에도 범용 AI처럼 자유롭게 답변하도록 설정합니다.
function buildSystemInstruction(contextJson) {
  return [
    '당신은 유방암 수술 후 회복 중인 사용자의 앱에 탑재된 친절하고 똑똑한 AI 어시스턴트입니다.',
    '1. 사용자가 자신의 몸 상태, 통증, 체온, 재활운동, 병원 내원 등에 대해 물어보면 아래 [현재 앱에 저장된 사용자 기록]을 참고하여 구체적이고 다정하게 답변하세요. (단, 의학적 진단이나 약 처방은 하지 마세요.)',
    '2. 사용자가 건강과 무관한 일상 대화, 요리/식단, 취미, 날씨, 유머, 상식, 감성 대화 등 어떤 주제를 물어보더라도 절대 거절하거나 건강 이야기로만 제한하지 말고, 실제 범용 AI처럼 자연스럽고 풍부하게 한국어로 답변하세요.',
    '3. 답변은 모바일 화면에서 읽기 편하도록 3~6문장 내외로 깔끔하게 정리해 주세요.',
    '',
    `[현재 앱에 저장된 사용자 기록]: ${contextJson}`,
  ].join('\n')
}

// 1순위: Gemini API 키가 있을 때 Google Gemini 2.5 Flash 모델 호출
async function callGeminiApi(apiKey, systemInstruction, history, userMessage) {
  const contents = [
    ...history.slice(-6).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ]

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API 오류 (${response.status})`)
  }
  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini 응답이 비어 있습니다.')
  return text.trim()
}

// 2순위 (기본 무료 실시간 LLM): API 키 없이도 동작하는 OpenAI 호환 실시간 LLM 호출
async function callFreeRealtimeLlm(systemInstruction, history, userMessage) {
  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.slice(-6).map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.text,
    })),
    { role: 'user', content: userMessage },
  ]

  // OpenAI 호환 POST 엔드포인트 호출
  try {
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages,
        temperature: 0.7,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const content = data?.choices?.[0]?.message?.content
      if (content) return content.trim()
    }
  } catch (err) {
    console.warn('POST LLM 호출 재시도 전환:', err)
  }

  // 백업 GET 실시간 LLM 엔드포인트 호출
  const combinedPrompt = `${systemInstruction}\n\n사용자 질문: ${userMessage}\n한국어 답변:`
  const fallbackRes = await fetch(
    `https://text.pollinations.ai/${encodeURIComponent(combinedPrompt)}?model=openai`
  )
  if (!fallbackRes.ok) {
    throw new Error('실시간 LLM 서버 연결에 실패했습니다.')
  }
  const fallbackText = await fallbackRes.text()
  return fallbackText.trim()
}

// 사용자의 질문, 이전 대화 내역, 앱 데이터를 받아 실제 AI 답변을 돌려줍니다.
export async function askLlmAssistant(userMessage, appData, history = []) {
  const contextJson = buildPatientContextText(appData)
  const systemInstruction = buildSystemInstruction(contextJson)
  const geminiKey = getSavedGeminiApiKey()

  if (geminiKey) {
    try {
      return await callGeminiApi(geminiKey, systemInstruction, history, userMessage)
    } catch (error) {
      console.warn('Gemini API 호출 실패, 기본 실시간 LLM으로 전환합니다:', error)
    }
  }

  return await callFreeRealtimeLlm(systemInstruction, history, userMessage)
}
