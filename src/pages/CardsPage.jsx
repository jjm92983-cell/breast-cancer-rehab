import { useState } from 'react'
import educationData from '../data/educationCards.json'

// Stitch 디자인 + 좌우 카드 슬라이드 애니메이션이 적용된 질환 이해 카드 화면입니다.
export default function CardsPage() {
  const cards = educationData.cards
  const [currentIndex, setCurrentIndex] = useState(0)
  // 카드를 넘기는 방향('next' 또는 'prev')에 따라 슬라이드 방향을 다르게 줍니다.
  const [slideDirection, setSlideDirection] = useState('next')

  const currentCard = cards[currentIndex]
  const isFirstCard = currentIndex === 0
  const isLastCard = currentIndex === cards.length - 1

  const handlePrev = () => {
    if (!isFirstCard) {
      setSlideDirection('prev')
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (!isLastCard) {
      setSlideDirection('next')
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleSelectDot = (index) => {
    if (index === currentIndex) return
    setSlideDirection(index > currentIndex ? 'next' : 'prev')
    setCurrentIndex(index)
  }

  return (
    <section className="flex flex-col space-y-5 pb-6">
      {/* 상단 타이틀 및 순서 배지 */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-primary">
            clinical_notes
          </span>
          <div>
            <h2 className="text-[19px] font-bold tracking-tight text-on-surface">
              질환 이해 카드
            </h2>
            <p className="text-[13px] text-on-surface-variant">
              한 장씩 넘겨 가며 천천히 읽어 보세요.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed-variant transition-all">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* 진행 점 인디케이터 */}
      <div
        className="flex items-center justify-center gap-2 py-1"
        aria-label="카드 순서 표시"
      >
        {cards.map((card, index) => {
          const isCurrent = index === currentIndex
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleSelectDot(index)}
              aria-label={`${index + 1}번째 카드로 이동`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                isCurrent
                  ? 'w-7 bg-primary'
                  : 'w-2.5 bg-surface-container-highest hover:bg-outline-variant'
              }`}
            />
          )
        })}
      </div>

      {/* 카드 본문: key가 바뀔 때마다 방향에 맞는 슬라이드 애니메이션이 실행됩니다 */}
      <article
        key={currentCard.id}
        className={`flex min-h-[340px] flex-col justify-between rounded-3xl bg-surface-container-lowest p-6 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05),0_2px_6px_-1px_rgba(45,49,46,0.02)] ${
          slideDirection === 'next' ? 'animate-card-next' : 'animate-card-prev'
        }`}
      >
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed-variant">
            <span className="material-symbols-outlined text-[14px]">spa</span>
            {currentCard.category}
          </span>

          <h3 className="text-[22px] font-bold leading-snug text-on-surface">
            {currentCard.title}
          </h3>

          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-base font-semibold leading-relaxed text-on-surface">
              {currentCard.summary}
            </p>
          </div>

          <ul className="space-y-3 pt-1 text-sm leading-relaxed text-on-surface-variant">
            {currentCard.points.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-primary">
                  check_circle
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-xl bg-[#FAF3E1] p-3 text-xs leading-relaxed text-[#70582B]">
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px]">
            info
          </span>
          <p>{currentCard.note}</p>
        </div>
      </article>

      {/* 이전 / 다음 버튼 */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={handlePrev}
          disabled={isFirstCard}
          className={`flex items-center justify-center gap-1.5 rounded-full py-3.5 text-sm font-bold transition-all ${
            isFirstCard
              ? 'cursor-not-allowed bg-surface-container text-outline'
              : 'bg-surface-container-lowest text-on-surface shadow-xs hover:bg-surface-container-low hover:-translate-y-0.5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          <span>이전 카드</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isLastCard}
          className={`flex items-center justify-center gap-1.5 rounded-full py-3.5 text-sm font-bold transition-all ${
            isLastCard
              ? 'cursor-not-allowed bg-surface-container text-outline'
              : 'bg-primary text-on-primary shadow-sm hover:bg-primary-container hover:-translate-y-0.5'
          }`}
        >
          <span>다음 카드</span>
          <span className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        </button>
      </div>
    </section>
  )
}
