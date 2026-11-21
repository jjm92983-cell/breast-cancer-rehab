import { useState } from 'react'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import CardsPage from './pages/CardsPage'
import ExercisePage from './pages/ExercisePage'
import RecordPage from './pages/RecordPage'
import TrendsPage from './pages/TrendsPage'
import AlertPage from './pages/AlertPage'
import SettingsPage from './pages/SettingsPage'
import exerciseData from './data/exercises.json'
import { evaluateAlerts } from './utils/alertEvaluator'
import {
  applyDemoData,
  getTodayDateString,
  loadAppData,
  resetAppData,
  saveAppData,
} from './utils/storage'

// Stitch 디자인의 Material Symbols 아이콘을 사용하는 7개 하단 탭 목록입니다.
const TABS = [
  { id: 'home', label: '홈', headerTitle: 'Home', icon: 'cottage' },
  { id: 'cards', label: '카드', headerTitle: 'Care Guide', icon: 'clinical_notes' },
  { id: 'exercise', label: '운동', headerTitle: 'Rehab Exercise', icon: 'self_improvement' },
  { id: 'record', label: '기록', headerTitle: 'Daily Log', icon: 'edit_note' },
  { id: 'trends', label: '추이', headerTitle: 'Weekly Trend', icon: 'trending_up' },
  { id: 'alert', label: '신호', headerTitle: 'Warning Signals', icon: 'notifications_active' },
  { id: 'settings', label: '설정', headerTitle: 'Settings', icon: 'tune' },
]

// 현재 허용 단계 기준으로 특정 날짜의 운동 완료율(%)을 계산합니다.
function calculateExerciseRate(allowedStage, completedIds) {
  const allowedExercises = exerciseData.exercises.filter(
    (ex) => ex.stage <= (allowedStage || 1)
  )
  if (allowedExercises.length === 0) {
    return 0
  }
  const completedCount = allowedExercises.filter((ex) =>
    completedIds.includes(ex.id)
  ).length
  return Math.round((completedCount / allowedExercises.length) * 100)
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [appData, setAppData] = useState(() => loadAppData())

  const alertStatus = evaluateAlerts(appData.records)
  const currentTabInfo = TABS.find((t) => t.id === activeTab) || TABS[0]

  const handleChangeAllowedStage = (stage) => {
    const nextData = {
      ...appData,
      allowedStage: stage,
    }
    saveAppData(nextData)
    setAppData(nextData)
  }

  const handleToggleExercise = (exerciseId) => {
    const today = getTodayDateString()
    const currentMap = appData.completedExercisesByDate || {}
    const todayIds = currentMap[today] || []

    const nextTodayIds = todayIds.includes(exerciseId)
      ? todayIds.filter((id) => id !== exerciseId)
      : [...todayIds, exerciseId]

    const nextRate = calculateExerciseRate(appData.allowedStage, nextTodayIds)

    const nextRecords = appData.records.map((record) =>
      record.date === today
        ? { ...record, exerciseCompletionRate: nextRate }
        : record
    )

    const nextData = {
      ...appData,
      completedExercisesByDate: {
        ...currentMap,
        [today]: nextTodayIds,
      },
      records: nextRecords,
    }
    saveAppData(nextData)
    setAppData(nextData)
  }

  const handleSaveTodayRecord = (recordInput) => {
    const today = recordInput.date
    const todayCompletedIds = appData.completedExercisesByDate?.[today] || []
    const exerciseCompletionRate = calculateExerciseRate(
      appData.allowedStage,
      todayCompletedIds
    )

    const newRecord = {
      ...recordInput,
      exerciseCompletionRate,
    }

    const hasToday = appData.records.some((r) => r.date === today)
    const nextRecords = hasToday
      ? appData.records.map((r) => (r.date === today ? newRecord : r))
      : [...appData.records, newRecord]

    nextRecords.sort((a, b) => a.date.localeCompare(b.date))

    const nextData = {
      ...appData,
      records: nextRecords,
    }
    saveAppData(nextData)
    setAppData(nextData)

    const nextAlertStatus = evaluateAlerts(nextRecords)
    if (nextAlertStatus.hasAlert) {
      setActiveTab('alert')
    }
  }

  const handleLoadDemo = () => {
    const demoLoaded = applyDemoData()
    setAppData(demoLoaded)
  }

  const handleReset = () => {
    const emptyData = resetAppData()
    setAppData(emptyData)
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage appData={appData} onNavigate={setActiveTab} />
      case 'cards':
        return <CardsPage />
      case 'exercise':
        return (
          <ExercisePage
            appData={appData}
            onToggleExercise={handleToggleExercise}
            onGoSettings={() => setActiveTab('settings')}
          />
        )
      case 'record':
        return (
          <RecordPage
            appData={appData}
            onSaveRecord={handleSaveTodayRecord}
          />
        )
      case 'trends':
        return (
          <TrendsPage
            appData={appData}
            onGoRecord={() => setActiveTab('record')}
            onGoExercise={() => setActiveTab('exercise')}
          />
        )
      case 'alert':
        return (
          <AlertPage
            appData={appData}
            onGoRecord={() => setActiveTab('record')}
          />
        )
      case 'settings':
        return (
          <SettingsPage
            appData={appData}
            onChangeAllowedStage={handleChangeAllowedStage}
            onLoadDemo={handleLoadDemo}
            onReset={handleReset}
          />
        )
      default:
        return <HomePage appData={appData} onNavigate={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-surface-dim/35 flex justify-center">
      <div className="relative flex min-h-screen w-full max-w-[430px] flex-col bg-surface shadow-[0_4px_24px_rgba(25,28,26,0.08)]">
        {/* Stitch 디자인 상단 고정 헤더 */}
        <header className="sticky top-0 z-30 w-full bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
          <div className="flex h-20 flex-col justify-center px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-bold tracking-tight text-on-surface">
                  {currentTabInfo.headerTitle}
                </h1>
                <span className="rounded-full bg-primary-fixed px-2.5 py-0.5 text-[11px] font-semibold text-on-primary-fixed-variant">
                  시연용 프로토타입
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                aria-label="설정으로 이동"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
              </button>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-outline">
                info
              </span>
              <p className="line-clamp-1 text-[13px] text-on-surface-variant">
                이 앱은 진단을 하지 않습니다. 의료진의 지시가 우선입니다
              </p>
            </div>
          </div>
        </header>

        {/* 본문 영역: activeTab이 바뀔 때마다 부드러운 페이지 등장 애니메이션이 실행됩니다 */}
        <main className="flex-1 px-5 py-5 pb-28 overflow-x-hidden">
          <div key={activeTab} className="animate-page-enter">
            {renderScreen()}
          </div>
        </main>

        {/* 하단 탭 네비게이션 */}
        <BottomNav
          tabs={TABS}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          hasAlert={alertStatus.hasAlert}
        />
      </div>
    </div>
  )
}
