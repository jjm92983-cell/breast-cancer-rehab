import { useState } from 'react'
import ExerciseAiModal from '../components/ExerciseAiModal'
import exerciseData from '../data/exercises.json'
import { getTodayDateString } from '../utils/storage'

// Stitch 디자인이 적용된 운동 가이드 화면 컴포넌트입니다.
export default function ExercisePage({
  appData,
  onToggleExercise,
  onGoSettings,
}) {
  const today = getTodayDateString()
  const allowedStage = appData.allowedStage || 1

  const [activeExercise, setActiveExercise] = useState(null)
  const [openStageVideo, setOpenStageVideo] = useState(null)

  const todayCompletedIds = appData.completedExercisesByDate?.[today] || []

  const allowedExercises = exerciseData.exercises.filter(
    (ex) => ex.stage <= allowedStage
  )

  const completedCount = allowedExercises.filter((ex) =>
    todayCompletedIds.includes(ex.id)
  ).length
  const totalAllowedCount = allowedExercises.length
  const completionRate =
    totalAllowedCount > 0
      ? Math.round((completedCount / totalAllowedCount) * 100)
      : 0

  const handleCompleteFromModal = (exerciseId) => {
    if (!todayCompletedIds.includes(exerciseId)) {
      onToggleExercise(exerciseId)
    }
    setActiveExercise(null)
  }

  return (
    <section className="flex flex-col space-y-5 pb-6">
      {/* 상단 담당의 허용 단계 & 오늘 운동 완료율 카드 (Stitch 스타일) */}
      <div className="flex flex-col gap-3.5 rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-[11px] font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px] text-tertiary">
                verified_user
              </span>
              담당의 허용 단계
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-[19px] font-bold text-primary">
                {allowedStage}단계까지 허용됨
              </span>
              <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[11px] font-semibold text-on-primary-fixed-variant">
                안전 단계
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onGoSettings}
            className="flex items-center gap-1 rounded-full bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high active:scale-95"
          >
            <span>단계 변경</span>
            <span className="material-symbols-outlined text-[14px]">tune</span>
          </button>
        </div>

        <div className="pt-2">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-on-surface-variant">오늘 운동 완료율</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-primary">
                {completedCount} / {totalAllowedCount}개
              </span>
              <span className="text-[11px] text-outline">({completionRate}%)</span>
            </div>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-high p-0.5">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${Math.max(4, completionRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 단계별 설명 및 타임라인 코스 카드 */}
      <div className="space-y-6">
        {exerciseData.stages.map((stageInfo) => {
          const isLocked = stageInfo.stage > allowedStage
          const stageExercises = exerciseData.exercises.filter(
            (ex) => ex.stage === stageInfo.stage
          )
          const isVideoExpanded = openStageVideo === stageInfo.stage
          const stageEmbedUrl = `https://www.youtube.com/embed/${exerciseData.youtubeVideoId}?start=${stageInfo.startSeconds || 0}&rel=0`

          return (
            <div key={stageInfo.stage} className="space-y-4">
              {/* 단계 헤더 카드 */}
              <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-on-primary-fixed-variant">
                      {stageInfo.stage}
                    </div>
                    <h2 className="text-[17px] font-bold tracking-tight text-on-surface">
                      {stageInfo.title}
                    </h2>
                  </div>
                  {isLocked ? (
                    <span className="flex items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
                      <span className="material-symbols-outlined text-[13px]">lock</span>
                      잠금
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-on-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-on-primary animate-pulse" />
                      진행 가능
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-on-surface-variant">
                  {stageInfo.description}
                </p>

                {!isLocked && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenStageVideo(isVideoExpanded ? null : stageInfo.stage)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-surface-container-low px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-surface-container active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        play_circle
                      </span>
                      <span>
                        {isVideoExpanded ? '단계 설명 영상 접기' : '단계 설명 영상 보기'}
                      </span>
                    </button>

                    {isVideoExpanded && (
                      <div className="animate-bubble-pop mt-3 overflow-hidden rounded-2xl border border-outline-variant/40 bg-inverse-surface">
                        <div className="aspect-video w-full">
                          <iframe
                            title={stageInfo.title}
                            src={stageEmbedUrl}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stitch 타임라인 형태의 운동 카드 목록 */}
              {isLocked ? (
                <div className="relative pl-7">
                  <div className="absolute left-2.5 top-3 bottom-3 w-[2px] border-l-2 border-dashed border-outline-variant/60" />
                  <div className="relative">
                    <div className="absolute -left-7 top-5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-lowest shadow-xs">
                      <div className="h-3.5 w-3.5 rounded-full bg-surface-container-highest" />
                    </div>
                    <article className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest p-4 opacity-75 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-on-surface">
                          {stageInfo.stage}단계 운동은 현재 잠겨 있습니다
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          담당의가 허용한 뒤 설정에서 단계를 변경하면 열립니다.
                        </span>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-outline">
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                      </div>
                    </article>
                  </div>
                </div>
              ) : (
                <div className="relative flex flex-col gap-4 pl-7">
                  {/* 왼쪽 세로 점선 타임라인 레일 */}
                  <div className="absolute left-2.5 top-5 bottom-8 w-[2px] border-l-2 border-dashed border-outline-variant/60" />

                  {stageExercises.map((exercise) => {
                    const isDone = todayCompletedIds.includes(exercise.id)
                    return (
                      <div key={exercise.id} className="relative">
                        {/* 타임라인 노드 마커 */}
                        <div className="absolute -left-7 top-5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-lowest shadow-xs">
                          {isDone ? (
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
                              ✓
                            </div>
                          ) : (
                            <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-secondary-container">
                              <div className="h-1.5 w-1.5 rounded-full bg-surface-container-lowest" />
                            </div>
                          )}
                        </div>

                        {/* 운동 카드 본문 */}
                        <article className="flex flex-col gap-3.5 rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-1.5 text-primary">
                                <span className="material-symbols-outlined text-[16px]">
                                  ondemand_video
                                </span>
                                <span className="text-[11px] font-semibold">
                                  재활 세션
                                </span>
                              </div>
                              <h4 className="text-[17px] font-bold leading-snug text-on-surface">
                                {exercise.name}
                              </h4>
                            </div>
                            <div className="shrink-0 rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
                              {exercise.reps}
                            </div>
                          </div>

                          <div className="rounded-xl bg-surface-container-low/70 p-3.5">
                            <p className="text-sm leading-relaxed text-on-surface-variant">
                              <strong className="font-semibold text-on-surface">
                                방법:{' '}
                              </strong>
                              {exercise.method}
                            </p>
                          </div>

                          <div className="flex items-start gap-2.5 rounded-xl bg-secondary-fixed/35 p-3.5 text-on-secondary-fixed-variant">
                            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-secondary">
                              lightbulb
                            </span>
                            <p className="text-[13px] leading-normal">
                              <strong>주의사항: </strong>
                              {exercise.caution}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveExercise(exercise)}
                              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-3 px-4 text-sm font-bold text-on-primary shadow-xs transition-all hover:bg-primary-container active:scale-[0.98]"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                fitness_center
                              </span>
                              <span>운동 시작</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onToggleExercise(exercise.id)}
                              className={`flex w-full items-center justify-center gap-1.5 rounded-full py-3 px-4 text-sm font-bold transition-all active:scale-[0.95] ${
                                isDone
                                  ? 'animate-chip-active bg-primary-fixed text-on-primary-fixed-variant shadow-xs'
                                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {isDone ? 'check_circle' : 'task_alt'}
                              </span>
                              <span>{isDone ? '완료됨' : '완료 체크'}</span>
                            </button>
                          </div>
                        </article>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 하단 통증 주의 안내 박스 (Stitch 스타일) */}
      <aside className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-4">
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-tertiary">
          favorite
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-on-surface">
            무리한 통증이 느껴지시나요?
          </span>
          <p className="text-xs leading-relaxed text-on-surface-variant">
            스트레칭 중 찌릿하거나 당기는 통증이 발생하면 즉시 멈추고 편안한 호흡을 유지해 주세요.
          </p>
        </div>
      </aside>

      {activeExercise && (
        <ExerciseAiModal
          exercise={activeExercise}
          youtubeVideoId={exerciseData.youtubeVideoId}
          isCompleted={todayCompletedIds.includes(activeExercise.id)}
          onCompleteAndClose={handleCompleteFromModal}
          onClose={() => setActiveExercise(null)}
        />
      )}
    </section>
  )
}
