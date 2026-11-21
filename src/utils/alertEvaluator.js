// 위험신호 기준값은 코드에 직접 적지 않고 별도 JSON 설정 파일에서 불러옵니다.
import alertRulesConfig from '../config/alertRules.json'

// 한 개의 규칙(rule)이 최근 기록에 해당하는지 검사하고, 해당하면 사유 설명을 돌려주는 도우미 함수입니다.
function checkSingleRule(rule, sortedRecords, config) {
  const latest = sortedRecords[sortedRecords.length - 1]
  const prev = sortedRecords.length >= 2 ? sortedRecords[sortedRecords.length - 2] : null
  const symptomLabels = config.labels?.symptoms || {}
  const woundLabels = config.labels?.woundSigns || {}

  // 1) 응급 증상 체크 (예: 호흡곤란, 흉통)
  if (Array.isArray(rule.checkedSymptomsAny)) {
    const matchedKeys = rule.checkedSymptomsAny.filter(
      (key) => Boolean(latest.emergencySymptoms?.[key])
    )
    if (matchedKeys.length > 0) {
      const names = matchedKeys.map((key) => symptomLabels[key] || key).join(', ')
      return {
        ruleId: rule.id,
        level: rule.level,
        message: rule.message,
        title: rule.description,
        detail: `체크된 응급 증상: ${names}`,
      }
    }
  }

  // 2) 체온 기준 검사 (체온이 '모름'(null)인 경우는 발열로 판정하지 않습니다)
  if (typeof rule.minTemperatureCelsius === 'number') {
    if (
      typeof latest.temperature === 'number' &&
      latest.temperature >= rule.minTemperatureCelsius
    ) {
      return {
        ruleId: rule.id,
        level: rule.level,
        message: rule.message,
        title: `체온 ${rule.minTemperatureCelsius.toFixed(1)}℃ 이상`,
        detail: `기록된 체온: ${latest.temperature.toFixed(1)}℃`,
      }
    }
  }

  // 3) 수술 부위 이상 징후 검사 (예: 붉어짐, 열감, 진물)
  if (Array.isArray(rule.checkedWoundSignsAny)) {
    const matchedWounds = rule.checkedWoundSignsAny.filter(
      (key) => Boolean(latest.woundSigns?.[key])
    )
    if (matchedWounds.length > 0) {
      const names = matchedWounds.map((key) => woundLabels[key] || key).join(', ')
      return {
        ruleId: rule.id,
        level: rule.level,
        message: rule.message,
        title: rule.description,
        detail: `체크된 부위 상태: ${names}`,
      }
    }
  }

  // 4) 팔 부종 '심함' 또는 전일 대비 악화 검사
  if (rule.armSwellingEquals || rule.checkWorsenedFromYesterday) {
    const order = config.armSwellingOrder || ['없음', '약간', '심함']
    const latestIndex = order.indexOf(latest.armSwelling)
    const prevIndex = prev ? order.indexOf(prev.armSwelling) : -1

    const isSevere =
      Boolean(rule.armSwellingEquals) &&
      latest.armSwelling === rule.armSwellingEquals
    const isWorsened =
      Boolean(rule.checkWorsenedFromYesterday) &&
      prev !== null &&
      prevIndex !== -1 &&
      latestIndex > prevIndex

    if (isSevere || isWorsened) {
      const reasons = []
      if (isSevere) reasons.push(`현재 팔 부종 '${latest.armSwelling}'`)
      if (isWorsened) {
        reasons.push(`전일(${prev.armSwelling}) 대비 '${latest.armSwelling}'으로 악화`)
      }
      return {
        ruleId: rule.id,
        level: rule.level,
        message: rule.message,
        title: rule.description,
        detail: reasons.join(' / '),
      }
    }
  }

  // 5) 통증 기준 점수 이상 검사
  if (typeof rule.minPainScore === 'number') {
    if (typeof latest.pain === 'number' && latest.pain >= rule.minPainScore) {
      return {
        ruleId: rule.id,
        level: rule.level,
        message: rule.message,
        title: `통증 ${rule.minPainScore}점 이상`,
        detail: `기록된 통증 점수: ${latest.pain} / 10점`,
      }
    }
  }

  // 6) 통증이 N일 연속 증가했는지 검사 (예: 2일 연속 증가하려면 최소 3일치 기록 필요)
  if (typeof rule.consecutiveIncreaseDays === 'number') {
    const days = rule.consecutiveIncreaseDays
    if (sortedRecords.length >= days + 1) {
      const recentSlice = sortedRecords.slice(-(days + 1))
      let isStrictlyIncreasing = true
      for (let i = 1; i < recentSlice.length; i += 1) {
        if (recentSlice[i].pain <= recentSlice[i - 1].pain) {
          isStrictlyIncreasing = false
          break
        }
      }

      if (isStrictlyIncreasing) {
        const painTrail = recentSlice.map((r) => r.pain).join(' → ')
        return {
          ruleId: rule.id,
          level: rule.level,
          message: rule.message,
          title: `통증이 ${days}일 연속 증가`,
          detail: `최근 ${days + 1}일 통증 변화: ${painTrail}`,
        }
      }
    }
  }

  return null
}

// 저장된 일일 기록 목록을 받아서 alertRules.json 기준으로 위험신호를 판정합니다.
export function evaluateAlerts(records, config = alertRulesConfig) {
  if (!Array.isArray(records) || records.length === 0) {
    return {
      hasRecords: false,
      hasAlert: false,
      highestLevel: null,
      primaryMessage: '',
      matchedAlerts: [],
      latestRecord: null,
    }
  }

  // 날짜 오름차순으로 정렬해 가장 마지막 날(최근)과 전날을 정확히 비교합니다.
  const sortedRecords = [...records].sort((a, b) =>
    a.date.localeCompare(b.date)
  )
  const latestRecord = sortedRecords[sortedRecords.length - 1]
  const priority = config.levelPriority || ['응급', '병원 연락', '주의 관찰']

  // 설정 파일(alertRules.json)의 모든 규칙을 하나씩 검사합니다.
  const matchedAlerts = config.rules
    .map((rule) => checkSingleRule(rule, sortedRecords, config))
    .filter(Boolean)

  // 위험 단계가 높은 순서(응급 > 병원 연락 > 주의 관찰)로 정렬합니다.
  matchedAlerts.sort((a, b) => {
    const idxA = priority.indexOf(a.level)
    const idxB = priority.indexOf(b.level)
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB)
  })

  const highestAlert = matchedAlerts[0] || null

  return {
    hasRecords: true,
    hasAlert: matchedAlerts.length > 0,
    highestLevel: highestAlert ? highestAlert.level : null,
    primaryMessage: highestAlert ? highestAlert.message : '',
    matchedAlerts,
    latestRecord,
  }
}
