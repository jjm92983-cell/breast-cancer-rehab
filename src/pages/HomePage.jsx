import HomeLlmChat from '../components/HomeLlmChat'
import exerciseData from '../data/exercises.json'
import { evaluateAlerts } from '../utils/alertEvaluator'
import { getTodayDateString } from '../utils/storage'

// Stitch 디자인이 적용된 홈 화면 컴포넌트입니다.
export default function HomePage({ appData, onNavigate }) {
  const today = getTodayDateString()
  const allowedStage = appData.allowedStage || 1

  const sortedRecords = [...(appData.records || [])].sort((a, b) =>
    a.date.localeCompare(b.date)
  )
  const todayRecord = sortedRecords.find((record) => record.date === today)
  const latestRecord = sortedRecords[sortedRecords.length - 1] || null

  const todayCompletedIds = appData.completedExercisesByDate?.[today] || []
  const allowedExercises = exerciseData.exercises.filter(
    (ex) => ex.stage <= allowedStage
  )
  const completedCount = allowedExercises.filter((ex) =>
    todayCompletedIds.includes(ex.id)
  ).length
  const totalCount = allowedExercises.length
  const exerciseRate =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const currentStageInfo =
    exerciseData.stages.find((s) => s.stage === allowedStage) ||
    exerciseData.stages[0]

  const alertStatus = evaluateAlerts(appData.records)

  return (
    <section className="flex flex-col gap-6 pb-4">
      {/* 상단 인사말 & 날짜 */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
            <span className="material-symbols-outlined material-fill text-[16px] text-primary">
              spa
            </span>
            마음 편한 회복 루틴
          </span>
          <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-medium text-on-surface-variant">
            {today}
          </span>
        </div>
        <h2 className="mt-0.5 text-[22px] font-bold tracking-tight text-on-surface">
          오늘도 한 걸음씩, 편안하게
        </h2>
      </div>

      {/* 1. 환자 프로필 및 현재 단계 카드 */}
      <div className="flex flex-col gap-4 rounded-3xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold text-on-primary-fixed-variant">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            허용 단계 {allowedStage}단계
          </span>
          <span className="text-[11px] font-medium text-outline">
            {appData.patientProfile ? appData.patientProfile.label : '자가간호 모드'}
          </span>
        </div>

        <div className="flex items-end justify-between pt-1">
          <div className="pr-2">
            <p className="text-[19px] font-bold tracking-tight text-on-surface">
              {appData.patientProfile
                ? appData.patientProfile.summary
                : '시연용 데모 데이터를 불러와 주세요'}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-on-surface-variant">
              {currentStageInfo.description}
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
            <span className="material-symbols-outlined text-[24px]">favorite</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-surface-container-low p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-primary">
              verified
            </span>
            <span className="text-[13px] font-medium text-on-surface">
              {currentStageInfo.title}
            </span>
          </div>
          {!appData.patientProfile ? (
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="text-xs font-bold text-primary underline"
            >
              데모 불러오기
            </button>
          ) : (
            <span className="text-xs font-bold text-primary">D+14</span>
          )}
        </div>
      </div>

      {/* 2. 위험신호 감지 시 따뜻한 테라코타 경고 카드 */}
      {alertStatus.hasAlert && (
        <div className="flex flex-col gap-2.5 rounded-3xl border-l-4 border-l-secondary bg-[#FFF8F5] p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-secondary-fixed px-2.5 py-1 text-xs font-bold text-on-secondary-fixed-variant">
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  emergency
                </span>
                {alertStatus.highestLevel}
              </span>
              <span className="h-2 w-2 rounded-full bg-secondary" />
            </div>
            <button
              type="button"
              onClick={() => onNavigate('alert')}
              className="flex items-center text-xs font-bold text-secondary hover:opacity-80"
            >
              자세히 보기
              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>
            </button>
          </div>
          <div className="mt-1">
            <h3 className="text-[17px] font-bold text-on-surface">
              {alertStatus.primaryMessage}
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-on-surface-variant">
              {alertStatus.matchedAlerts.map((a) => `${a.title} (${a.detail})`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* 3. 오늘 재활운동 카드 */}
      <div className="flex flex-col gap-4 rounded-3xl bg-surface-container-lowest p-6 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary-fixed/50 text-secondary">
              <span className="material-symbols-outlined material-fill text-[20px]">
                fitness_center
              </span>
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-on-surface">오늘 재활운동</h3>
              <span className="text-[11px] text-on-surface-variant">
                단계별 맞춤 어깨 스트레칭
              </span>
            </div>
          </div>
          <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface">
            {completedCount} / {totalCount}개 ({exerciseRate}%)
          </span>
        </div>

        {/* 진행률 바 */}
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-high p-0.5">
            <div
              className="h-full rounded-full bg-secondary-container transition-all duration-500"
              style={{ width: `${Math.max(4, exerciseRate)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-outline">
            <span>현재 {allowedStage}단계 루틴</span>
            <span>목표: {totalCount}개 완주</span>
          </div>
        </div>

        {/* 추천 루틴 미리보기 타일 */}
        <div className="flex flex-col gap-2.5 pt-1">
          {allowedExercises.slice(0, 2).map((ex, idx) => {
            const isDone = todayCompletedIds.includes(ex.id)
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => onNavigate('exercise')}
                className="flex items-center justify-between rounded-2xl bg-surface-container-low/70 p-3 text-left transition-colors hover:bg-surface-container"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      isDone
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {isDone ? '✓' : idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-on-surface">
                      {ex.name}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {ex.reps}
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-outline">
                  play_circle
                </span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => onNavigate('exercise')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary-container px-6 py-4 text-[17px] font-semibold text-on-secondary shadow-sm transition-transform active:scale-[0.99] hover:opacity-95"
        >
          <span className="material-symbols-outlined text-[20px]">play_arrow</span>
          {exerciseRate === 100 ? '운동 목록 다시 보기' : '재활운동 시작하기'}
        </button>
      </div>

      {/* 4. 오늘 몸 상태 기록 카드 */}
      <div className="flex flex-col gap-4 rounded-3xl bg-surface-container-lowest p-6 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed-variant">
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-on-surface">
                오늘 몸 상태 기록
              </h3>
              <span className="text-[11px] text-on-surface-variant">
                통증 점수 및 부기 관찰
              </span>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              todayRecord
                ? 'bg-primary-fixed text-on-primary-fixed-variant'
                : 'bg-surface-container-highest text-on-surface-variant'
            }`}
          >
            {todayRecord ? '기록 완료' : '미완료'}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-on-surface-variant">
          내원·원격 상담 시 확인용으로 오늘 상태를 30초 만에 남겨보세요.
        </p>

        {latestRecord && (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1 rounded-2xl bg-surface-container-low p-3">
              <span className="text-[11px] text-outline">
                {todayRecord ? '오늘 기록 통증' : '최근 기록 통증'}
              </span>
              <span className="text-sm font-bold text-on-surface">
                {latestRecord.pain}점 / 10점
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl bg-surface-container-low p-3">
              <span className="text-[11px] text-outline">팔 부종 상태</span>
              <span className="text-sm font-bold text-on-surface">
                {latestRecord.armSwelling}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => onNavigate('record')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-[17px] font-semibold text-on-primary shadow-sm transition-transform active:scale-[0.99] hover:opacity-95"
        >
          <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
          {todayRecord ? '오늘 기록 수정하기' : '오늘 기록 입력하기'}
        </button>
      </div>

      {/* 5. AI 도우미 (실제 LLM 자유 대화 + 추천 프롬프트 3종) */}
      <HomeLlmChat appData={appData} />
    </section>
  )
}
