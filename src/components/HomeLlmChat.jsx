import { useEffect, useRef, useState } from 'react'
import {
  RECOMMENDED_PROMPTS,
  askLlmAssistant,
} from '../utils/llmAssistant'

// 홈 화면에 들어가는 실제 LLM 채팅창 + 상단 추천 프롬프트 3가지 컴포넌트입니다.
export default function HomeLlmChat({ appData }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: '안녕하세요! 재활·기록 관련 질문은 물론 일상적인 궁금한 점도 무엇이든 편하게 물어보세요.',
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatBoxRef = useRef(null)

  // 새 메시지가 추가될 때마다 채팅창 아래로 부드럽게 스크롤합니다.
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // 질문을 전송하고 실제 LLM으로부터 실시간 답변을 받아오는 함수입니다.
  const handleSendQuestion = async (questionText) => {
    const trimmed = questionText.trim()
    if (!trimmed || isLoading) return

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    }

    const prevHistory = messages.filter((m) => m.id !== 'welcome')
    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setIsLoading(true)

    try {
      const replyText = await askLlmAssistant(trimmed, appData, prevHistory)
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: replyText,
        },
      ])
    } catch (err) {
      console.error('AI 응답 오류:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: '일시적으로 AI 서버 응답이 지연되고 있습니다. 잠시 후 다시 질문해 주세요.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    handleSendQuestion(inputText)
  }

  return (
    <div className="rounded-3xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-on-surface">AI 도우미</h3>
            <span className="text-[11px] text-on-surface-variant">실시간 AI 자유 대화</span>
          </div>
        </div>
        <span className="rounded-full bg-primary-fixed px-2.5 py-0.5 text-[11px] font-semibold text-on-primary-fixed-variant">
          실시간 LLM
        </span>
      </div>

      {/* 채팅창 위 추천 프롬프트 3가지 */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-on-surface-variant">추천 질문</p>
        <div className="flex flex-col gap-1.5">
          {RECOMMENDED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendQuestion(prompt)}
              className="w-full rounded-2xl bg-surface-container-low px-3.5 py-2.5 text-left text-xs font-semibold text-primary transition-colors hover:bg-primary-fixed/60 disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px] shrink-0">chat_bubble</span>
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 채팅 대화창 */}
      <div
        ref={chatBoxRef}
        className="max-h-72 min-h-[180px] space-y-2.5 overflow-y-auto rounded-2xl bg-surface-container-low p-3.5"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          return (
            <div
              key={msg.id}
              className={`animate-bubble-pop flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  isUser
                    ? 'bg-primary font-medium text-on-primary shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface shadow-xs'
                }`}
              >
                {msg.text}
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div className="animate-bubble-pop flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-surface-container-lowest px-3.5 py-2.5 text-xs font-medium text-on-surface-variant shadow-xs">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: '0.15s' }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: '0.3s' }}
                />
              </span>
              <span>AI가 답변을 생성하고 있습니다...</span>
            </div>
          </div>
        )}
      </div>

      {/* 질문 입력창 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="건강 질문이나 일상 대화 무엇이든 입력하세요..."
          className="flex-1 rounded-full bg-surface-container-low px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          전송
        </button>
      </form>
    </div>
  )
}
