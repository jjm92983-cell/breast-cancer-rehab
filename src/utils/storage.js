// 시연용 데모 데이터 JSON 파일을 불러옵니다.
import demoData from '../data/demoRecords.json'

// 브라우저 localStorage(작은 보관함)에 데이터를 저장할 때 쓰는 고유 이름(열쇠)입니다.
const STORAGE_KEY = 'breast_cancer_rehab_app_v1'

// 날짜를 "YYYY-MM-DD" (예: "2026-11-17") 모양의 글자로 바꿔주는 도우미 함수입니다.
// 한국 시간(내 컴퓨터 시간)을 기준으로 정확히 계산합니다.
export function formatDateToYMD(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 오늘 날짜를 "YYYY-MM-DD" 형식으로 돌려줍니다.
export function getTodayDateString() {
  return formatDateToYMD(new Date())
}

// 오늘에서 며칠 전(예: -1은 어제, -7은 일주일 전) 날짜를 계산해 줍니다.
export function getDateStringWithOffset(dayOffset) {
  const target = new Date()
  target.setDate(target.getDate() + dayOffset)
  return formatDateToYMD(target)
}

// 아무 데이터도 없을 때 사용할 깨끗한 기본 상태(초기값)를 만듭니다.
export function createEmptyAppData() {
  return {
    // 담당의 허용 재활운동 단계 (기본값: 1단계)
    allowedStage: 1,
    // 데모 데이터를 불러온 상태인지 여부
    isDemoLoaded: false,
    // 가상 환자 정보 (데모 데이터를 불러오면 채워집니다)
    patientProfile: null,
    // 날짜별 일일 기록 목록
    records: [],
    // 날짜별 완료한 운동 ID 목록 (예: { "2026-11-17": ["ex-1", "ex-2"] })
    completedExercisesByDate: {},
  }
}

// 브라우저 localStorage에서 저장된 앱 데이터를 꺼내옵니다.
export function loadAppData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // 저장된 데이터가 없으면 깨끗한 기본 상태를 돌려줍니다.
    if (!raw) {
      return createEmptyAppData()
    }
    const parsed = JSON.parse(raw)
    // 혹시 빠진 항목이 있더라도 오류가 나지 않도록 기본 상태와 합쳐서 돌려줍니다.
    return {
      ...createEmptyAppData(),
      ...parsed,
    }
  } catch (error) {
    // 저장된 글자가 손상되었을 경우 안전하게 기본 상태를 돌려줍니다.
    console.error('저장된 데이터를 읽는 중 오류가 발생했습니다:', error)
    return createEmptyAppData()
  }
}

// 앱 데이터를 브라우저 localStorage에 저장합니다.
export function saveAppData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('데이터를 저장하는 중 오류가 발생했습니다:', error)
  }
}

// 데모 데이터(가상 환자 10일치 기록)를 오늘 날짜에 맞게 변환해 불러오고 저장합니다.
export function applyDemoData() {
  // dayOffset(-10 ~ -1)을 실제 어제까지의 날짜("YYYY-MM-DD")로 변환합니다.
  const convertedRecords = demoData.records.map((item) => {
    const { dayOffset, ...rest } = item
    return {
      ...rest,
      date: getDateStringWithOffset(dayOffset),
    }
  })

  const nextData = {
    allowedStage: demoData.defaultAllowedStage,
    isDemoLoaded: true,
    patientProfile: demoData.patientProfile,
    records: convertedRecords,
    completedExercisesByDate: {},
  }

  saveAppData(nextData)
  return nextData
}

// 저장된 모든 데이터를 지우고 처음 상태로 되돌립니다.
export function resetAppData() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('데이터 초기화 중 오류가 발생했습니다:', error)
  }
  return createEmptyAppData()
}
