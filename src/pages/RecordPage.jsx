import { useEffect, useState } from 'react'
import { getTodayDateString } from '../utils/storage'

// Stitch 디자인 아이콘이 포함된 수술 부위 체크 항목입니다.
const WOUND_SIGN_OPTIONS = [
  { key: 'redness', label: '붉어짐', icon: 'circle' },
  { key: 'heat', label: '열감 (뜨끈함)', icon: 'flare' },
  { key: 'swelling', label: '부기', icon: 'water_drop' },
  { key: 'oozing', label: '진물', icon: 'opacity' },
]

const ARM_SWELLING_OPTIONS = ['없음', '약간', '심함']
const SHOULDER_MOBILITY_OPTIONS = ['편함', '불편', '많이 불편']

const EMERGENCY_OPTIONS = [
  { key: 'dyspnea', label: '호흡곤란 (숨참)', icon: 'pulmonology' },
  { key: 'chestPain', label: '흉통 (가슴 통증)', icon: 'vital_signs' },
]

const MOOD_OPTIONS = [
  { value: '힘듦', emoji: '😣', label: '힘듦' },
  { value: '불안', emoji: '😟', label: '불안' },
  { value: '보통', emoji: '😐', label: '보통' },
  { value: '좋음', emoji: '🙂', label: '좋음' },
  { value: '아주 좋음', emoji: '😊', label: '아주 좋음' },
]

function buildInitialForm(existingRecord) {
  if (existingRecord) {
    const isTempUnknown =
      existingRecord.temperature === null ||
      existingRecord.temperature === undefined
    return {
      pain: existingRecord.pain ?? 2,
      temperature: isTempUnknown ? '' : String(existingRecord.temperature),
      temperatureUnknown: isTempUnknown,
      woundSigns: {
        redness: Boolean(existingRecord.woundSigns?.redness),
        heat: Boolean(existingRecord.woundSigns?.heat),
        swelling: Boolean(existingRecord.woundSigns?.swelling),
        oozing: Boolean(existingRecord.woundSigns?.oozing),
      },
      armSwelling: existingRecord.armSwelling || '없음',
      shoulderMobility: existingRecord.shoulderMobility || '편함',
      emergencySymptoms: {
        dyspnea: Boolean(existingRecord.emergencySymptoms?.dyspnea),
        chestPain: Boolean(existingRecord.emergencySymptoms?.chestPain),
      },
      mood: existingRecord.mood || '보통',
      memo: existingRecord.memo || '',
    }
  }

  return {
    pain: 2,
    temperature: '36.6',
    temperatureUnknown: false,
    woundSigns: {
      redness: false,
      heat: false,
      swelling: false,
      oozing: false,
    },
    armSwelling: '없음',
    shoulderMobility: '편함',
    emergencySymptoms: {
      dyspnea: false,
      chestPain: false,
    },
    mood: '보통',
    memo: '',
  }
}

// 통증 점수에 따른 Stitch 슬라이더 배경 그라데이션과 상태 안내를 계산합니다.
function getPainUiInfo(pain) {
  const pct = (pain / 10) * 100
  let color = '#366854'
  if (pain > 3 && pain <= 6) color = '#fd8863'
  if (pain > 6) color = '#9f4122'

  const sliderBackground = `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #e0e3df ${pct}%, #e0e3df 100%)`

  if (pain <= 2) {
    return {
      sliderBackground,
      icon: 'check_circle',
      iconColor: 'text-primary',
      desc: '일상생활에 경미한 불편이 있는 양호한 상태입니다.',
    }
  }
  if (pain <= 6) {
    return {
      sliderBackground,
      icon: 'info',
      iconColor: 'text-secondary',
      desc: '중등도 통증입니다. 무리한 활동을 피하고 휴식을 취해주세요.',
    }
  }
  return {
    sliderBackground,
    icon: 'warning',
    iconColor: 'text-error',
    desc: '심한 통증입니다. 지속될 경우 전담 의료진에게 문의하세요.',
  }
}

// Stitch 디자인이 적용된 오늘 기록 화면 컴포넌트입니다.
export default function RecordPage({ appData, onSaveRecord }) {
  const today = getTodayDateString()
  const existingTodayRecord = appData.records.find(
    (record) => record.date === today
  )

  const [form, setForm] = useState(() => buildInitialForm(existingTodayRecord))
  const [savedNotice, setSavedNotice] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    setForm(buildInitialForm(existingTodayRecord))
  }, [existingTodayRecord])

  const painUi = getPainUiInfo(form.pain)

  const handleToggleWoundSign = (key) => {
    setForm((prev) => ({
      ...prev,
      woundSigns: {
        ...prev.woundSigns,
        [key]: !prev.woundSigns[key],
      },
    }))
  }

  const handleToggleEmergency = (key) => {
    setForm((prev) => ({
      ...prev,
      emergencySymptoms: {
        ...prev.emergencySymptoms,
        [key]: !prev.emergencySymptoms[key],
      },
    }))
  }

  const handleToggleTemperatureUnknown = () => {
    setForm((prev) => {
      const nextUnknown = !prev.temperatureUnknown
      return {
        ...prev,
        temperatureUnknown: nextUnknown,
        temperature: !nextUnknown && !prev.temperature ? '36.6' : prev.temperature,
      }
    })
    setErrorMessage('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    let finalTemperature = null
    if (!form.temperatureUnknown) {
      const parsedTemp = Number.parseFloat(form.temperature)
      if (Number.isNaN(parsedTemp) || parsedTemp < 34 || parsedTemp > 43) {
        setErrorMessage('체온을 34.0℃ ~ 43.0℃ 사이의 숫자로 입력하거나 "모름"을 선택해 주세요.')
        setSavedNotice(false)
        return
      }
      finalTemperature = Number(parsedTemp.toFixed(1))
    }

    setErrorMessage('')
    onSaveRecord({
      date: today,
      pain: Number(form.pain),
      temperature: finalTemperature,
      woundSigns: form.woundSigns,
      armSwelling: form.armSwelling,
      shoulderMobility: form.shoulderMobility,
      emergencySymptoms: form.emergencySymptoms,
      mood: form.mood,
      memo: form.memo.trim(),
    })
    setSavedNotice(true)
  }

  return (
    <section className="flex flex-col gap-5 pb-6">
      {/* 상단 페이지 헤더 카드 (Stitch 스타일) */}
      <div className="flex flex-col rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined material-fill text-[24px] text-primary">
              edit_calendar
            </span>
            <h2 className="text-[22px] font-bold tracking-tight text-on-surface">
              오늘 기록
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">
              calendar_today
            </span>
            {today}
          </span>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl bg-surface-container-low p-3">
          <span className="material-symbols-outlined material-fill mt-0.5 shrink-0 text-[18px] text-primary">
            verified_user
          </span>
          <p className="text-[13px] leading-relaxed text-on-surface-variant">
            30초 안에 입력해 두면 내원·원격 상담 시 간호사·의사가 경과를 한눈에 확인할 수 있습니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* 1. 오늘 통증 점수 슬라이더 카드 */}
        <div className="flex flex-col rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-fixed text-xs font-semibold text-on-primary-fixed-variant">
                1
              </span>
              <label
                htmlFor="pain-slider"
                className="text-[17px] font-semibold text-on-surface"
              >
                오늘 통증 점수
              </label>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed px-3 py-1 text-[17px] text-on-secondary-fixed-variant">
              <span className="material-symbols-outlined text-[16px] text-secondary">
                sentiment_satisfied
              </span>
              <span className="font-bold">{form.pain}</span>
              <span className="text-[11px] opacity-80">/ 10</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-2 py-3">
            <input
              id="pain-slider"
              type="range"
              min="0"
              max="10"
              step="1"
              value={form.pain}
              onChange={(e) => setForm({ ...form, pain: Number(e.target.value) })}
              style={{ background: painUi.sliderBackground }}
              className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-surface-container-high accent-secondary"
            />
            <div className="flex items-center justify-between px-1 text-[11px]">
              <span className="flex flex-col items-start font-medium text-primary">
                <span>0</span>
                <span className="text-[10px] font-normal text-on-surface-variant">
                  통증 없음
                </span>
              </span>
              <span className="flex flex-col items-center font-medium text-on-surface-variant">
                <span>5</span>
                <span className="text-[10px] font-normal">보통</span>
              </span>
              <span className="flex flex-col items-end font-medium text-secondary">
                <span>10</span>
                <span className="text-[10px] font-normal text-on-surface-variant">
                  매우 심함
                </span>
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2.5 text-[13px] text-on-surface-variant">
            <span className={`material-symbols-outlined text-[16px] ${painUi.iconColor}`}>
              {painUi.icon}
            </span>
            <span>{painUi.desc}</span>
          </div>
        </div>

        {/* 2. 체온 카드 ('모름' 포함) */}
        <div className="flex flex-col rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-fixed text-xs font-semibold text-on-primary-fixed-variant">
                2
              </span>
              <label
                htmlFor="temperature-input"
                className="text-[17px] font-semibold text-on-surface"
              >
                체온
              </label>
            </div>
            <label className="flex cursor-pointer select-none items-center gap-1.5">
              <input
                type="checkbox"
                checked={form.temperatureUnknown}
                onChange={handleToggleTemperatureUnknown}
                className="h-4 w-4 cursor-pointer rounded accent-primary"
              />
              <span className="text-[13px] text-on-surface-variant">
                모름 (체온계 없음)
              </span>
            </label>
          </div>

          <div
            className={`flex items-center justify-between rounded-xl bg-surface-container-low p-4 transition-opacity ${
              form.temperatureUnknown ? 'opacity-45' : 'opacity-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed/60">
                <span className="material-symbols-outlined text-[22px] text-primary">
                  device_thermostat
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-on-surface-variant">현재 체온</span>
                <span className="text-[11px] font-medium text-primary">
                  {form.temperatureUnknown
                    ? '모름으로 기록됨'
                    : '정상 범위 (36.0 ~ 37.2°C)'}
                </span>
              </div>
            </div>
            <div className="flex items-baseline gap-1 rounded-xl bg-surface-container-lowest px-4 py-2 shadow-xs">
              <input
                id="temperature-input"
                type="number"
                step="0.1"
                min="34"
                max="43"
                disabled={form.temperatureUnknown}
                value={form.temperatureUnknown ? '' : form.temperature}
                onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                placeholder={form.temperatureUnknown ? '-' : '36.6'}
                className="w-16 bg-transparent text-right text-[22px] font-bold text-on-surface outline-none disabled:cursor-not-allowed"
              />
              <span className="text-[17px] font-medium text-on-surface-variant">
                °C
              </span>
            </div>
          </div>
        </div>

        {/* 3. 수술 부위 상태 (2x2 아이콘 칩 그리드) */}
        <div className="flex flex-col rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-fixed text-xs font-semibold text-on-primary-fixed-variant">
                3
              </span>
              <h3 className="text-[17px] font-semibold text-on-surface">
                수술 부위 상태
              </h3>
            </div>
            <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-medium text-on-surface-variant">
              해당 시 체크
            </span>
          </div>
          <p className="mb-4 text-[13px] text-on-surface-variant">
            현재 수술 부위에 나타나는 이상 증상이 있다면 선택해 주세요.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {WOUND_SIGN_OPTIONS.map((item) => {
              const checked = form.woundSigns[item.key]
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleToggleWoundSign(item.key)}
                  className={`flex items-center justify-between rounded-xl p-3.5 text-left transition-all duration-200 ${
                    checked
                      ? 'animate-chip-active bg-primary-fixed shadow-xs ring-1 ring-primary/30'
                      : 'bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        checked ? 'text-primary' : 'text-outline'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm font-semibold text-on-surface">
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      checked
                        ? 'material-fill text-primary'
                        : 'text-outline-variant'
                    }`}
                  >
                    check_circle
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 4. 수술한 쪽 팔 부종 */}
        <div className="flex flex-col rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)]">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-fixed text-xs font-semibold text-on-primary-fixed-variant">
              4
            </span>
            <h3 className="text-[17px] font-semibold text-on-surface">
              수술한 쪽 팔 부종
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {ARM_SWELLING_OPTIONS.map((option) => {
              const isSelected = form.armSwelling === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setForm({ ...form, armSwelling: option })}
                  className={`rounded-xl py-3 text-sm font-bold transition-all ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>

        {/* 5. 어깨 움직임 */}
        <div className="flex flex-col rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)]">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-fixed text-xs font-semibold text-on-primary-fixed-variant">
              5
            </span>
            <h3 className="text-[17px] font-semibold text-on-surface">
              어깨 움직임
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {SHOULDER_MOBILITY_OPTIONS.map((option) => {
              const isSelected = form.shoulderMobility === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setForm({ ...form, shoulderMobility: option })}
                  className={`rounded-xl py-3 text-sm font-bold transition-all ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>

        {/* 6. 응급 증상 (테라코타 톤 카드) */}
        <div className="flex flex-col rounded-2xl bg-[#FFF8F5] p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary-fixed text-xs font-semibold text-on-secondary-fixed-variant">
                6
              </span>
              <h3 className="text-[17px] font-semibold text-on-surface">
                응급 증상
              </h3>
            </div>
            <span className="rounded-full bg-secondary-fixed px-2.5 py-0.5 text-[11px] font-bold text-on-secondary-fixed-variant">
              해당 시 즉시 체크
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {EMERGENCY_OPTIONS.map((item) => {
              const checked = form.emergencySymptoms[item.key]
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleToggleEmergency(item.key)}
                  className={`flex items-center justify-between rounded-xl p-3.5 text-left transition-all ${
                    checked
                      ? 'bg-secondary-fixed text-on-secondary-fixed-variant shadow-xs'
                      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        checked ? 'text-secondary' : 'text-outline'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm font-bold">{item.label}</span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      checked
                        ? 'material-fill text-secondary'
                        : 'text-outline-variant'
                    }`}
                  >
                    check_circle
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 7. 오늘 기분 */}
        <div className="flex flex-col rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)]">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-fixed text-xs font-semibold text-on-primary-fixed-variant">
              7
            </span>
            <h3 className="text-[17px] font-semibold text-on-surface">오늘 기분</h3>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {MOOD_OPTIONS.map((option) => {
              const isSelected = form.mood === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm({ ...form, mood: option.value })}
                  className={`flex flex-col items-center justify-center rounded-xl py-2.5 transition-all ${
                    isSelected
                      ? 'bg-primary-fixed text-on-primary-fixed-variant shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="text-2xl leading-none">{option.emoji}</span>
                  <span className="mt-1.5 text-[11px] font-bold">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 8. 메모 (선택) */}
        <div className="flex flex-col rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)]">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-fixed text-xs font-semibold text-on-primary-fixed-variant">
              8
            </span>
            <label
              htmlFor="record-memo"
              className="text-[17px] font-semibold text-on-surface"
            >
              메모 (선택)
            </label>
          </div>
          <textarea
            id="record-memo"
            rows={2}
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            placeholder="내원 시 간호사·의사에게 전할 내용이 있으면 적어주세요."
            className="w-full rounded-xl bg-surface-container-low p-3.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl bg-error-container p-3.5 text-center text-xs font-semibold text-on-error-container"
          >
            {errorMessage}
          </div>
        )}

        <div className="pt-1">
          <button
            type="submit"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-[17px] font-bold text-on-primary shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined material-fill text-[20px]">
              task_alt
            </span>
            <span>{existingTodayRecord ? '기록 수정 저장하기' : '기록 저장하기'}</span>
          </button>

          {savedNotice && (
            <div
              role="status"
              className="animate-bubble-pop mt-3 rounded-xl bg-primary-fixed p-3 text-center text-xs font-semibold text-on-primary-fixed-variant"
            >
              오늘의 건강 기록이 안전하게 저장되었습니다!
            </div>
          )}
        </div>
      </form>
    </section>
  )
}
