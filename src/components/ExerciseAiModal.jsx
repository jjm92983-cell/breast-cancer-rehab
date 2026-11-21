import { useEffect, useRef, useState } from 'react'

// 운동 종류(poseType)에 따라 카메라 화면에서 중점적으로 추적할 목표 영역(Target Zone)과 안내를 정의합니다.
function getPoseTrackingConfig(poseType) {
  switch (poseType) {
    case 'arm_raise':
    case 'overhead_stretch':
    case 'wand_flexion':
      return {
        guideText: '팔을 천천히 위로 들어 올렸다가 내려주세요',
        yRange: [0.08, 0.72],
        xRange: [0.15, 0.85],
        minActiveBlocks: 5,
      }
    case 'shoulder_roll':
      return {
        guideText: '양쪽 어깨를 위로 올렸다가 천천히 원을 그리며 내려주세요',
        yRange: [0.22, 0.75],
        xRange: [0.18, 0.82],
        minActiveBlocks: 4,
      }
    case 'scapula_squeeze':
    case 'wand_rotation':
      return {
        guideText: '양팔과 어깨를 옆으로 천천히 폈다가 제자리로 돌아오세요',
        yRange: [0.25, 0.85],
        xRange: [0.1, 0.9],
        minActiveBlocks: 4,
      }
    case 'breathing':
    default:
      return {
        guideText: '깊게 호흡하며 어깨를 천천히 내렸다가 풀어주세요',
        yRange: [0.2, 0.85],
        xRange: [0.2, 0.8],
        minActiveBlocks: 3,
      }
  }
}

// Stitch 디자인이 적용된 운동 영상 재생 + 운동 설명 + 전면카메라 동작 트래킹 모달입니다.
export default function ExerciseAiModal({
  exercise,
  youtubeVideoId,
  onCompleteAndClose,
  onClose,
}) {
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [repProgress, setRepProgress] = useState(0)
  const [repCount, setRepCount] = useState(0)
  const [isMoving, setIsMoving] = useState(false)
  const [trackedPoint, setTrackedPoint] = useState(null)
  const [aiFeedback, setAiFeedback] = useState(
    '운동 시작을 누르면 전면카메라가 켜지고 동작을 인식합니다.'
  )

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const prevGridRef = useRef(null)
  const phaseRef = useRef('up')
  const cooldownUntilRef = useRef(0)

  const targetReps = exercise.targetReps || 5
  const trackingConfig = getPoseTrackingConfig(exercise.poseType)

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    prevGridRef.current = null
    phaseRef.current = 'up'
  }

  useEffect(() => {
    return () => {
      stopCameraStream()
    }
  }, [])

  const handleStartCamera = async () => {
    setCameraError('')
    setRepCount(0)
    setRepProgress(0)
    setTrackedPoint(null)
    prevGridRef.current = null
    phaseRef.current = 'up'

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('이 브라우저에서는 카메라를 열 수 없습니다.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })
      streamRef.current = stream
      setIsCameraOn(true)
      setAiFeedback(trackingConfig.guideText)

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      }, 50)
    } catch (err) {
      console.error('카메라 실행 오류:', err)
      setCameraError('카메라 권한을 허용해 주세요.')
    }
  }

  useEffect(() => {
    if (!isCameraOn) return undefined

    const COLS = 16
    const ROWS = 12
    const BLOCK_DIFF_THRESHOLD = 20

    const intervalId = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video.readyState < 2) return

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      const W = 64
      const H = 48
      ctx.drawImage(video, 0, 0, W, H)
      const pixels = ctx.getImageData(0, 0, W, H).data

      const currentGrid = new Float32Array(COLS * ROWS)
      for (let gy = 0; gy < ROWS; gy += 1) {
        for (let gx = 0; gx < COLS; gx += 1) {
          let sum = 0
          for (let py = 0; py < 4; py += 1) {
            for (let px = 0; px < 4; px += 1) {
              const y = gy * 4 + py
              const x = gx * 4 + px
              const idx = (y * W + x) * 4
              sum +=
                pixels[idx] * 0.299 +
                pixels[idx + 1] * 0.587 +
                pixels[idx + 2] * 0.114
            }
          }
          currentGrid[gy * COLS + gx] = sum / 16
        }
      }

      if (!prevGridRef.current) {
        prevGridRef.current = currentGrid
        return
      }

      const prevGrid = prevGridRef.current
      let activeBlocksInZone = 0
      let weightedX = 0
      let weightedY = 0
      let totalWeight = 0

      const [minY, maxY] = trackingConfig.yRange
      const [minX, maxX] = trackingConfig.xRange

      for (let gy = 0; gy < ROWS; gy += 1) {
        const normY = (gy + 0.5) / ROWS
        for (let gx = 0; gx < COLS; gx += 1) {
          const normX = (gx + 0.5) / COLS
          const idx = gy * COLS + gx
          const diff = Math.abs(currentGrid[idx] - prevGrid[idx])

          if (
            diff >= BLOCK_DIFF_THRESHOLD &&
            normY >= minY &&
            normY <= maxY &&
            normX >= minX &&
            normX <= maxX
          ) {
            activeBlocksInZone += 1
            const mirroredX = 1 - normX
            weightedX += mirroredX * diff
            weightedY += normY * diff
            totalWeight += diff
          }
        }
      }

      prevGridRef.current = currentGrid

      const hasRealMovement = activeBlocksInZone >= trackingConfig.minActiveBlocks
      setIsMoving(hasRealMovement)

      if (hasRealMovement && totalWeight > 0) {
        setTrackedPoint({
          x: Math.round((weightedX / totalWeight) * 100),
          y: Math.round((weightedY / totalWeight) * 100),
        })
      } else {
        setTrackedPoint(null)
      }

      const now = Date.now()
      if (now < cooldownUntilRef.current) {
        return
      }

      if (!hasRealMovement) {
        return
      }

      const stepIncrement = Math.min(14, Math.max(6, Math.round(activeBlocksInZone * 1.1)))

      setRepCount((currentReps) => {
        if (currentReps >= targetReps) return currentReps

        setRepProgress((prevProg) => {
          if (phaseRef.current === 'up') {
            const nextProg = Math.min(50, prevProg + stepIncrement)
            if (nextProg >= 50) {
              phaseRef.current = 'down'
              cooldownUntilRef.current = Date.now() + 500
              setAiFeedback('좋습니다! 이제 천천히 시작 자세로 돌아오세요.')
            } else {
              setAiFeedback('동작 인식 중 — 천천히 끝까지 움직여 주세요.')
            }
            return nextProg
          }

          const nextProg = prevProg + stepIncrement
          if (nextProg >= 100) {
            const nextReps = currentReps + 1
            phaseRef.current = 'up'
            cooldownUntilRef.current = Date.now() + 800
            setRepCount(nextReps)

            if (nextReps >= targetReps) {
              setAiFeedback(`목표한 ${targetReps}회를 모두 마쳤습니다!`)
            } else {
              setAiFeedback(`${nextReps}회 완료! 호흡을 가다듬고 다음 동작을 이어가세요.`)
            }
            return 0
          }

          setAiFeedback('천천히 시작 자세로 돌아오는 중입니다.')
          return nextProg
        })

        return currentReps
      })
    }, 150)

    return () => clearInterval(intervalId)
  }, [isCameraOn, targetReps, trackingConfig])

  const embedUrl = `https://www.youtube.com/embed/${youtubeVideoId}?start=${exercise.startSeconds || 0}&rel=0`

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={exercise.name}
      className="animate-modal-backdrop fixed inset-0 z-50 flex justify-center overflow-y-auto bg-inverse-surface/75 backdrop-blur-xs"
    >
      <div className="animate-modal-sheet relative flex min-h-screen w-full max-w-[430px] flex-col bg-surface">
        {/* 상단 헤더 */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-surface/95 px-5 py-4 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
          <div className="pr-2">
            <span className="text-xs font-bold text-primary">
              {exercise.stage}단계 재활운동
            </span>
            <h3 className="text-[17px] font-bold leading-snug text-on-surface">
              {exercise.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraStream()
              onClose()
            }}
            className="shrink-0 rounded-full bg-surface-container px-3.5 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
          >
            닫기
          </button>
        </header>

        <div className="flex-1 space-y-4 p-5 pb-24">
          {/* 1. 단계별 운동 영상 */}
          <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
            <div className="aspect-video w-full bg-inverse-surface">
              <iframe
                title={exercise.name}
                src={embedUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* 2. 운동 설명 */}
          <div className="space-y-3 rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-on-surface">운동 설명</h4>
              <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed-variant">
                {exercise.reps}
              </span>
            </div>

            <div className="rounded-xl bg-surface-container-low p-3.5">
              <p className="text-sm leading-relaxed text-on-surface-variant">
                <strong className="font-bold text-on-surface">방법: </strong>
                {exercise.method}
              </p>
            </div>

            <div className="rounded-xl bg-secondary-fixed/40 p-3.5 text-xs leading-relaxed text-on-secondary-fixed-variant">
              <strong className="font-bold">주의사항: </strong>
              {exercise.caution}
            </div>
          </div>

          {/* 3. 전면카메라 AI 동작 따라하기 */}
          <div className="space-y-3 rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-on-surface">AI 동작 따라하기</h4>
              {isCameraOn && (
                <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-extrabold text-on-primary-fixed-variant">
                  {repCount} / {targetReps}회
                </span>
              )}
            </div>

            {!isCameraOn ? (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleStartCamera}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-base font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    videocam
                  </span>
                  <span>운동 시작</span>
                </button>
                {cameraError && (
                  <p className="text-xs font-medium text-error">{cameraError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-inverse-surface">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="h-full w-full -scale-x-100 object-cover"
                  />

                  <canvas
                    ref={canvasRef}
                    width={64}
                    height={48}
                    className="hidden"
                  />

                  <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 rounded-full bg-inverse-surface/80 px-3 py-1 text-xs font-bold text-inverse-on-surface backdrop-blur-xs">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isMoving ? 'bg-primary-fixed animate-ping' : 'bg-outline'
                        }`}
                      />
                      {isMoving ? '움직임 감지됨' : '동작 대기 중'}
                    </span>
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-on-primary">
                      {repCount} / {targetReps}회
                    </span>
                  </div>

                  {/* 상체 가이드라인 실루엣 */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <svg
                      viewBox="0 0 240 200"
                      className="h-44 w-56 opacity-80"
                      fill="none"
                    >
                      <circle
                        cx="120"
                        cy="46"
                        r="22"
                        stroke="#b8eed5"
                        strokeWidth="2.5"
                        strokeDasharray="5 4"
                      />
                      <line
                        x1="48"
                        y1="92"
                        x2="192"
                        y2="92"
                        stroke="#9dd2b9"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                      <path
                        d="M70 175 L82 95 C92 84, 148 84, 158 95 L170 175"
                        stroke="#fd8863"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="6 4"
                      />
                    </svg>
                  </div>

                  {/* 실시간 움직임 위치 트래킹 마커 */}
                  {trackedPoint && (
                    <div
                      className="pointer-events-none absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary-fixed bg-primary/50 shadow-md transition-all duration-100"
                      style={{
                        left: `${trackedPoint.x}%`,
                        top: `${trackedPoint.y}%`,
                      }}
                    />
                  )}

                  <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-inverse-surface/85 p-2.5 text-inverse-on-surface backdrop-blur-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">
                        {repProgress < 50 ? '1단계: 동작 수행' : '2단계: 제자리로 돌아오기'}
                      </span>
                      <span className="font-bold text-primary-fixed">{repProgress}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-on-surface-variant">
                      <div
                        className="h-full rounded-full bg-primary-fixed transition-all duration-150"
                        style={{ width: `${repProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-container-low p-3 text-xs font-semibold text-on-surface">
                  {aiFeedback}
                </div>
              </div>
            )}
          </div>

          {/* 4. 운동 완료 저장 버튼 */}
          <button
            type="button"
            onClick={() => {
              stopCameraStream()
              onCompleteAndClose(exercise.id)
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-bold text-on-primary shadow-md transition-all hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-[20px]">task_alt</span>
            <span>운동 완료</span>
          </button>
        </div>
      </div>
    </div>
  )
}
