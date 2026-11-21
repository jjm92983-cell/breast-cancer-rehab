// Stitch 디자인 + 부드러운 탭 클릭 애니메이션이 적용된 하단 네비게이션입니다.
export default function BottomNav({ tabs, activeTab, onSelectTab, hasAlert }) {
  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-4px_20px_-2px_rgba(45,49,46,0.06)]"
    >
      <ul className="flex h-16 items-center justify-around px-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          const showAlertDot = tab.id === 'alert' && hasAlert

          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`group flex min-h-[48px] w-full flex-col items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'font-bold text-primary'
                    : 'font-medium text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <div
                  className={`relative flex items-center justify-center rounded-full px-3 py-0.5 transition-all duration-300 ${
                    isActive
                      ? 'bg-primary-fixed/85 -translate-y-0.5 scale-105 shadow-2xs'
                      : 'bg-transparent group-hover:bg-surface-container'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[21px] transition-transform duration-200 ${
                      isActive ? 'material-fill scale-105' : 'group-hover:scale-105'
                    }`}
                  >
                    {tab.icon}
                  </span>
                  {showAlertDot && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-secondary ring-2 ring-surface-container-lowest animate-pulse" />
                  )}
                </div>
                <span
                  className={`mt-0.5 text-[11px] leading-[14px] transition-all duration-200 ${
                    isActive ? 'translate-y-0 opacity-100' : 'opacity-85'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
