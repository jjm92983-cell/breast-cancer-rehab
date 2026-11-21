import { useState } from 'react'
import exerciseData from '../data/exercises.json'
import {
  getSavedGeminiApiKey,
  saveGeminiApiKey,
} from '../utils/llmAssistant'

const STAGE_OPTIONS = exerciseData.stages

// Stitch 디자인이 적용된 설정 화면 컴포넌트입니다.
export default function SettingsPage({
  appData,
  onChangeAllowedStage,
  onLoadDemo,
  onReset,
}) {
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState(() => getSavedGeminiApiKey())

  const handleSelectStage = (stage) => {
    onChangeAllowedStage(stage)
    setFeedbackMessage(`담당의 허용 단계가 ${stage}단계로 저장되었습니다.`)
  }

  const handleLoadDemoClick = () => {
    onLoadDemo()
    setFeedbackMessage(
      '가상 환자(45세, 유방절제술 후 2주) 10일치 데모 데이터를 불러왔습니다.'
    )
  }

  const handleResetClick = () => {
    onReset()
    setFeedbackMessage('모든 저장 데이터가 초기화되었습니다.')
  }

  const handleSaveApiKey = (event) => {
    event.preventDefault()
    saveGeminiApiKey(apiKeyInput)
    setFeedbackMessage(
      apiKeyInput.trim()
        ? 'Gemini API 키가 저장되었습니다.'
        : 'API 키를 비웠습니다. 기본 실시간 LLM 모드로 동작합니다.'
    )
  }

  return (
    <section className="flex flex-col space-y-5 pb-6">
      <div className="flex items-center gap-2 pt-1">
        <span className="material-symbols-outlined text-[22px] text-primary">
          tune
        </span>
        <div>
          <h2 className="text-[19px] font-bold tracking-tight text-on-surface">
            설정
          </h2>
          <p className="text-[13px] text-on-surface-variant">
            담당의가 허용한 운동 단계를 선택하고 시연용 데이터를 관리합니다.
          </p>
        </div>
      </div>

      {feedbackMessage && (
        <div
          role="status"
          className="rounded-2xl bg-primary-fixed px-4 py-3 text-xs font-semibold text-on-primary-fixed-variant"
        >
          {feedbackMessage}
        </div>
      )}

      {/* 1. 담당의 허용 단계 선택 */}
      <div className="rounded-3xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
        <h3 className="text-[17px] font-bold text-on-surface">
          담당의 허용 운동 단계
        </h3>
        <p className="mt-1 text-xs text-on-surface-variant">
          선택한 단계까지의 운동만 열리고, 이후 단계는 잠금 표시됩니다.
        </p>

        <div className="mt-4 space-y-2.5">
          {STAGE_OPTIONS.map((option) => {
            const isSelected = appData.allowedStage === option.stage
            return (
              <button
                key={option.stage}
                type="button"
                onClick={() => handleSelectStage(option.stage)}
                className={`w-full rounded-2xl p-4 text-left transition-all ${
                  isSelected
                    ? 'bg-primary-fixed text-on-primary-fixed shadow-xs'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{option.title}</span>
                  {isSelected && (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-on-primary">
                      선택됨
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {option.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. 시연용 데모 데이터 불러오기 / 초기화 */}
      <div className="rounded-3xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
        <h3 className="text-[17px] font-bold text-on-surface">
          시연용 데모 데이터
        </h3>
        <p className="mt-1 text-xs text-on-surface-variant">
          실제 환자 정보는 사용하지 않으며 브라우저(localStorage)에만 저장됩니다.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={handleLoadDemoClick}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-on-primary shadow-xs transition-all hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
            <span>데모 데이터 불러오기</span>
          </button>

          <button
            type="button"
            onClick={handleResetClick}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-surface-container py-3 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">
              restart_alt
            </span>
            <span>초기화 (모든 기록 지우기)</span>
          </button>
        </div>
      </div>

      {/* 3. 현재 저장 상태 */}
      <div className="rounded-3xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
        <h3 className="text-[17px] font-bold text-on-surface">
          현재 저장 상태
        </h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between border-b border-surface-container pb-2">
            <dt className="text-on-surface-variant">현재 허용 단계</dt>
            <dd className="font-bold text-primary">{appData.allowedStage}단계</dd>
          </div>
          <div className="flex justify-between border-b border-surface-container pb-2">
            <dt className="text-on-surface-variant">가상 환자 정보</dt>
            <dd className="font-semibold text-on-surface">
              {appData.patientProfile
                ? appData.patientProfile.summary
                : '미설정 (초기 상태)'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-on-surface-variant">저장된 일일 기록</dt>
            <dd className="font-bold text-secondary">
              {appData.records.length}일치
            </dd>
          </div>
        </dl>
      </div>

      {/* 4. AI 도우미 Gemini API 키 설정 (선택 사항) */}
      <form
        onSubmit={handleSaveApiKey}
        className="rounded-3xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)] space-y-3"
      >
        <div>
          <h3 className="text-[17px] font-bold text-on-surface">
            AI 도우미 API 키 설정 (선택)
          </h3>
          <p className="mt-1 text-xs text-on-surface-variant">
            비워 두어도 기본 무료 실시간 LLM이 작동하며, 본인 Gemini API 키를 넣으면 Gemini 2.5 모델로 연결됩니다.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="AIza... (선택 입력)"
            className="flex-1 rounded-full bg-surface-container-low px-4 py-2.5 text-xs text-on-surface outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-on-primary hover:bg-primary-container"
          >
            저장
          </button>
        </div>
      </form>
    </section>
  )
}
