import alertRules from '../config/alertRules.json'
import { evaluateAlerts } from '../utils/alertEvaluator'

// Stitch 디자인의 위험 단계별 스타일을 돌려줍니다.
function getLevelStyle(level) {
  switch (level) {
    case '응급':
      return {
        box: 'border-l-4 border-l-error bg-error-container/45 text-on-surface',
        badge: 'bg-error text-on-error',
        icon: 'emergency',
      }
    case '병원 연락':
      return {
        box: 'border-l-4 border-l-secondary bg-[#FFF8F5] text-on-surface',
        badge: 'bg-secondary-fixed text-on-secondary-fixed-variant',
        icon: 'call',
      }
    case '주의 관찰':
      return {
        box: 'border-l-4 border-l-[#D86B49] bg-[#FAF3E1] text-on-surface',
        badge: 'bg-secondary-fixed text-on-secondary-fixed-variant',
        icon: 'visibility',
      }
    default:
      return {
        box: 'bg-surface-container-lowest text-on-surface',
        badge: 'bg-primary-fixed text-on-primary-fixed-variant',
        icon: 'verified',
      }
  }
}

// Stitch 디자인이 적용된 위험신호 안내 화면 컴포넌트입니다.
export default function AlertPage({ appData, onGoRecord }) {
  const result = evaluateAlerts(appData.records, alertRules)
  const style = getLevelStyle(result.highestLevel)

  return (
    <section className="flex flex-col space-y-5 pb-6">
      <div className="flex items-center gap-2 pt-1">
        <span className="material-symbols-outlined text-[22px] text-secondary">
          notifications_active
        </span>
        <div>
          <h2 className="text-[19px] font-bold tracking-tight text-on-surface">
            위험신호 안내
          </h2>
          <p className="text-[13px] text-on-surface-variant">
            가장 최근 기록을 기준표(alertRules.json)와 비교해 안내합니다.
          </p>
        </div>
      </div>

      {/* 고정 면책 문구 배너 (Stitch Pale Honey 톤) */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-[#FAF3E1] p-4 text-xs font-semibold text-[#70582B]">
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px]">
          info
        </span>
        <span>{alertRules.disclaimer}</span>
      </div>

      {/* 1) 아직 기록이 없을 때 */}
      {!result.hasRecords && (
        <div className="rounded-3xl bg-surface-container-lowest p-6 text-center shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
          <p className="text-base font-bold text-on-surface">
            아직 확인된 일일 기록이 없습니다.
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">
            오늘 기록을 입력하거나 설정에서 데모 데이터를 불러오면 위험신호 여부를 바로 확인할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={onGoRecord}
            className="mt-4 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-on-primary hover:bg-primary-container"
          >
            오늘 기록 입력하러 가기
          </button>
        </div>
      )}

      {/* 2) 위험신호 감지 시 */}
      {result.hasRecords && result.hasAlert && (
        <div className="space-y-4">
          <div
            className={`rounded-3xl p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)] ${style.box}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${style.badge}`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {style.icon}
                </span>
                {result.highestLevel} 단계
              </span>
              <span className="text-xs font-medium text-on-surface-variant">
                기준일: {result.latestRecord.date}
              </span>
            </div>

            <h3 className="mt-3 text-[22px] font-bold leading-snug text-on-surface">
              {result.primaryMessage}
            </h3>

            <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant">
              병원 연락 또는 내원 시 아래 확인된 항목을 간호사·의사에게 그대로 말씀해 주세요.
            </p>
          </div>

          <div className="rounded-3xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
            <h4 className="text-base font-bold text-on-surface">
              확인된 항목 ({result.matchedAlerts.length}건)
            </h4>
            <ul className="mt-3 space-y-2.5">
              {result.matchedAlerts.map((item) => {
                const itemStyle = getLevelStyle(item.level)
                return (
                  <li
                    key={item.ruleId}
                    className="rounded-2xl bg-surface-container-low p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-on-surface">
                        {item.title}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${itemStyle.badge}`}
                      >
                        {item.level}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-secondary">
                      {item.detail}
                    </p>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      {/* 3) 위험신호가 없을 때 (안정 상태) */}
      {result.hasRecords && !result.hasAlert && (
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed-variant">
              <span className="material-symbols-outlined text-[15px]">
                check_circle
              </span>
              기준 이내
            </span>
            <span className="text-xs font-medium text-on-surface-variant">
              기준일: {result.latestRecord.date}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-bold text-on-surface">
            현재 기록 기준으로 해당되는 위험신호가 없습니다.
          </h3>
          <p className="mt-2 rounded-2xl bg-surface-container-low p-3.5 text-sm text-on-surface-variant">
            최근 기록 — 통증 {result.latestRecord.pain}/10 · 체온{' '}
            {typeof result.latestRecord.temperature === 'number'
              ? `${result.latestRecord.temperature.toFixed(1)}℃`
              : '모름'}{' '}
            · 팔 부종 {result.latestRecord.armSwelling}
          </p>
        </div>
      )}

      {/* 적용 중인 기준표 보기 */}
      <details className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)]">
        <summary className="cursor-pointer text-sm font-bold text-on-surface">
          적용 중인 위험신호 기준표 보기 (alertRules.json)
        </summary>
        <ul className="mt-3 space-y-2 border-t border-surface-container pt-3 text-xs text-on-surface-variant">
          {alertRules.rules.map((rule) => (
            <li key={rule.id} className="flex justify-between gap-2">
              <span>
                [{rule.level}] {rule.description}
                {typeof rule.minTemperatureCelsius === 'number'
                  ? ` (${rule.minTemperatureCelsius.toFixed(1)}℃)`
                  : ''}
                {typeof rule.minPainScore === 'number'
                  ? ` (${rule.minPainScore}점)`
                  : ''}
                {typeof rule.consecutiveIncreaseDays === 'number'
                  ? ` (${rule.consecutiveIncreaseDays}일)`
                  : ''}
              </span>
              <span className="shrink-0 font-semibold text-on-surface">
                {rule.message}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}
