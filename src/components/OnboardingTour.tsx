'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useOnboarding } from './OnboardingContext'
import { ONBOARDING_STEPS, type TourStep } from '@/lib/onboarding-steps'

const PADDING = 8
const TOOLTIP_GAP = 12
const MOBILE_BP = 1024

export default function OnboardingTour() {
  const {
    isActive,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  } = useOnboarding()

  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Track mobile breakpoint
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BP)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Build list of valid steps (elements that exist in DOM)
  const findTarget = useCallback(
    (step: TourStep): Element | null => {
      const sel =
        isMobile && step.mobileSelector ? step.mobileSelector : step.selector
      return document.querySelector(sel)
    },
    [isMobile],
  )

  const validSteps = useMemo(() => {
    if (!isActive || !mounted) return []
    return ONBOARDING_STEPS.filter(s => findTarget(s) !== null)
  }, [isActive, mounted, findTarget])

  const step = validSteps[currentStep] as TourStep | undefined

  // Update rect when step changes, on scroll, on resize
  useEffect(() => {
    if (!isActive || !step) return

    const el = findTarget(step)
    if (!el) return

    const update = () => setRect(el.getBoundingClientRect())
    update()

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [isActive, step, findTarget])

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') skipTour()
      if (e.key === 'ArrowRight') nextStep()
      if (e.key === 'ArrowLeft') prevStep()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isActive, skipTour, nextStep, prevStep])

  // End tour if no valid steps
  useEffect(() => {
    if (isActive && mounted && validSteps.length === 0) {
      completeTour()
    }
  }, [isActive, mounted, validSteps.length, completeTour])

  if (!mounted || !isActive || !step || !rect) return null

  const placement =
    isMobile && step.mobilePlacement ? step.mobilePlacement : step.placement

  const isFirst = currentStep === 0
  const isLast = currentStep >= validSteps.length - 1

  // Highlight box
  const hl = {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  }

  // Tooltip positioning
  const ts: React.CSSProperties = { position: 'fixed' }
  switch (placement) {
    case 'bottom':
      ts.top = hl.top + hl.height + TOOLTIP_GAP
      ts.left = hl.left + hl.width / 2
      ts.transform = 'translateX(-50%)'
      break
    case 'top':
      ts.bottom = window.innerHeight - hl.top + TOOLTIP_GAP
      ts.left = hl.left + hl.width / 2
      ts.transform = 'translateX(-50%)'
      break
    case 'left':
      ts.top = hl.top + hl.height / 2
      ts.right = window.innerWidth - hl.left + TOOLTIP_GAP
      ts.transform = 'translateY(-50%)'
      break
    case 'right':
      ts.top = hl.top + hl.height / 2
      ts.left = hl.left + hl.width + TOOLTIP_GAP
      ts.transform = 'translateY(-50%)'
      break
  }

  return createPortal(
    <>
      {/* Click-catcher backdrop */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 55 }}
        onClick={skipTour}
      />

      {/* Spotlight highlight */}
      <div
        className="fixed rounded-xl transition-all duration-300 ease-out"
        style={{
          zIndex: 56,
          top: hl.top,
          left: hl.left,
          width: hl.width,
          height: hl.height,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'none',
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="tour-tooltip-enter fixed w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-yt-card p-5 shadow-2xl ring-1 ring-yt-border"
        style={{ zIndex: 57, ...ts }}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-yt-text-secondary">
            {currentStep + 1} of {validSteps.length}
          </span>
          <button
            onClick={skipTour}
            className="text-xs font-medium text-yt-text-secondary transition-colors hover:text-yt-text"
          >
            Skip tour
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-yt-border">
          <div
            className="h-full rounded-full bg-yt-red transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / validSteps.length) * 100}%`,
            }}
          />
        </div>

        {/* Content */}
        <h3 className="text-sm font-semibold text-yt-text">{step.title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-yt-text-secondary">
          {step.description}
        </p>

        {/* Navigation */}
        <div className="mt-4 flex gap-2">
          {!isFirst && (
            <button
              onClick={prevStep}
              className="flex-1 rounded-xl border border-yt-border py-2 text-xs font-medium text-yt-text-secondary transition-colors hover:bg-yt-bg-alt"
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? completeTour : nextStep}
            className="flex-1 rounded-xl bg-yt-red py-2 text-xs font-semibold text-white transition-colors hover:bg-yt-red-hover"
          >
            {isLast ? 'Got it!' : 'Next'}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
