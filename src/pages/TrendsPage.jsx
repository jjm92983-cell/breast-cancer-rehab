import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import alertRules from '../config/alertRules.json'

function formatShortDate(dateString) {
  if (!dateString || dateString.length < 10) return dateString
  return `${dateString.slice(5, 7)}/${dateString.slice(8, 10)}`
}

function getFeverThreshold() {
  const feverRule = alertRules.rules.find(
    (rule) => typeof rule.minTemperatureCelsius === 'number'
  )
  return feverRule ? feverRule.minTemperatureCelsius : null
}

// Stitch 디자인이 적용된 주간 추이 화면 컴포넌트입니다.
export default function TrendsPage({ appData, onGoRecord, onGoExercise }) {
  const sortedRecords = [...appData.records].sort((a, b) =>
    a.date.localeCompare(b.date)
  )
  const recent7Days = sortedRecords.slice(-7)

  const chartData = recent7Days.map((record) => ({
    ...record,
    shortDate: formatShortDate(record.date),
  }))

  const feverThreshold = getFeverThreshold()
  const firstRecord = chartData[0]
  const lastRecord = chartData[chartData.length - 1]
  const minPain =
    chartData.length > 0
      ? Math.min(...chartData.map((r) => r.pain ?? 0))
      : 0

  return (
    <section className="flex flex-col space-y-5 pb-6">
      {/* 상단 인트로 섹션 */}
      <div className="flex flex-col space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-primary">
              show_chart
            </span>
            <h2 className="text-[19px] font-bold tracking-tight text-on-surface">
              주간 추이 (최근 7일)
            </h2>
          </div>
          {chartData.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-primary shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              최근 {chartData.length}일
            </span>
          )}
        </div>
        <p className="text-[13px] leading-relaxed text-on-surface-variant">
          내원 또는 원격 상담 시 의료진이 재활 경과를 한눈에 확인하는 그래프입니다.
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest p-6 text-center shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
          <p className="text-base font-bold text-on-surface">
            아직 그래프를 그릴 기록이 없습니다.
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">
            오늘 기록을 저장하거나 설정에서 데모 데이터를 불러오면 최근 7일 변화가 표시됩니다.
          </p>
          <button
            type="button"
            onClick={onGoRecord}
            className="mt-4 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:opacity-90"
          >
            오늘 기록 입력하러 가기
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* 회복 진행 상태 요약 배너 (Stitch 스타일) */}
          <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-4 shadow-2xs">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
                  <span className="material-symbols-outlined text-[20px] text-on-primary-fixed-variant">
                    spa
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-primary">
                    회복 진행 상태
                  </span>
                  <span className="text-[17px] font-bold text-on-surface">
                    {lastRecord.pain <= firstRecord.pain
                      ? '통증 완화 안정기 유지 중'
                      : '통증 변화 주의 관찰 필요'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[11px] text-on-surface-variant">
                  최저 통증
                </span>
                <span className="text-[17px] font-bold text-secondary">
                  {minPain}점
                </span>
              </div>
            </div>
          </div>

          {/* 1. 통증 변화 (테라코타 라인 차트) */}
          <article className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                  <h3 className="text-[17px] font-bold text-on-surface">
                    1. 통증 변화 (0~10점)
                  </h3>
                </div>
                <p className="pl-4 text-[13px] text-on-surface-variant">
                  숫자가 낮아질수록 통증이 줄어든 것입니다.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-secondary-fixed px-2.5 py-1 text-xs font-semibold text-on-secondary-fixed-variant">
                {firstRecord.pain}점 → {lastRecord.pain}점
              </span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e3df" />
                  <XAxis
                    dataKey="shortDate"
                    tick={{ fontSize: 11, fill: '#404944' }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    tick={{ fontSize: 11, fill: '#707974' }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} / 10점`, '통증']}
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload?.date || label
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="pain"
                    name="통증"
                    stroke="#9f4122"
                    strokeWidth={3}
                    dot={{ r: 4.5, fill: '#ffffff', stroke: '#9f4122', strokeWidth: 2.5 }}
                    activeDot={{ r: 6, fill: '#9f4122' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-surface-container p-3 text-[13px] text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                insights
              </span>
              <span>
                최근 {chartData.length}일간 통증이 {firstRecord.pain}점에서{' '}
                {lastRecord.pain}점으로 기록되었습니다.
              </span>
            </div>
          </article>

          {/* 2. 운동 완료율 (세이지 그린 막대 차트) */}
          <article className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <h3 className="text-[17px] font-bold text-on-surface">
                    2. 운동 완료율 (%)
                  </h3>
                </div>
                <p className="pl-4 text-[13px] text-on-surface-variant">
                  허용 단계 운동 중 하루에 마친 비율입니다.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-primary-fixed px-2.5 py-1 text-xs font-semibold text-on-primary-fixed-variant">
                {firstRecord.exerciseCompletionRate ?? 0}% →{' '}
                {lastRecord.exerciseCompletionRate ?? 0}%
              </span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e3df" />
                  <XAxis
                    dataKey="shortDate"
                    tick={{ fontSize: 11, fill: '#404944' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fontSize: 11, fill: '#707974' }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, '운동 완료율']}
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload?.date || label
                    }
                  />
                  <Bar
                    dataKey="exerciseCompletionRate"
                    name="운동 완료율"
                    fill="#366854"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {onGoExercise && (
              <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-3 text-[13px] text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    fitness_center
                  </span>
                  <span>
                    최근 기록({lastRecord.shortDate}):{' '}
                    <strong>{lastRecord.exerciseCompletionRate ?? 0}% 완료</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onGoExercise}
                  className="shrink-0 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-on-primary hover:opacity-90"
                >
                  운동 시작
                </button>
              </div>
            )}
          </article>

          {/* 3. 체온 변화 (℃) */}
          <article className="space-y-4 rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-tertiary" />
                  <h3 className="text-[17px] font-bold text-on-surface">
                    3. 체온 변화 (℃)
                  </h3>
                </div>
                <p className="pl-4 text-[13px] text-on-surface-variant">
                  체온 &apos;모름&apos;으로 기록한 날은 빈칸으로 표시됩니다.
                </p>
              </div>
              {feverThreshold !== null && (
                <span className="rounded-full bg-secondary-fixed px-2.5 py-1 text-xs font-semibold text-on-secondary-fixed-variant">
                  기준선 {feverThreshold.toFixed(1)}℃
                </span>
              )}
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e3df" />
                  <XAxis
                    dataKey="shortDate"
                    tick={{ fontSize: 11, fill: '#404944' }}
                  />
                  <YAxis
                    domain={[35.5, 39.5]}
                    tick={{ fontSize: 11, fill: '#707974' }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      typeof value === 'number' ? `${value.toFixed(1)}℃` : '모름',
                      '체온',
                    ]}
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload?.date || label
                    }
                  />
                  {feverThreshold !== null && (
                    <ReferenceLine
                      y={feverThreshold}
                      stroke="#9f4122"
                      strokeDasharray="4 4"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="체온"
                    stroke="#224f44"
                    strokeWidth={3}
                    connectNulls={false}
                    dot={{ r: 4.5, fill: '#ffffff', stroke: '#224f44', strokeWidth: 2.5 }}
                    activeDot={{ r: 6, fill: '#224f44' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}
