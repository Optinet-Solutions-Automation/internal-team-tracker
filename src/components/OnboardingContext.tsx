'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

const STORAGE_KEY = 'onboarding_tour_completed'

type OnboardingContextValue = {
  isActive: boolean
  currentStep: number
  totalSteps: number
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  completeTour: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

const noop = () => {}
const defaultValue: OnboardingContextValue = {
  isActive: false,
  currentStep: 0,
  totalSteps: 0,
  startTour: noop,
  nextStep: noop,
  prevStep: noop,
  skipTour: noop,
  completeTour: noop,
}

export function OnboardingProvider({
  children,
  stepCount,
}: {
  children: ReactNode
  stepCount: number
}) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      const timer = setTimeout(() => setIsActive(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const markDone = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsActive(false)
    setCurrentStep(0)
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      if (prev >= stepCount - 1) {
        markDone()
        return 0
      }
      return prev + 1
    })
  }, [stepCount, markDone])

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }, [])

  const startTour = useCallback(() => {
    setCurrentStep(0)
    setIsActive(true)
  }, [])

  if (!mounted) {
    return (
      <OnboardingContext.Provider value={defaultValue}>
        {children}
      </OnboardingContext.Provider>
    )
  }

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: stepCount,
        startTour,
        nextStep,
        prevStep,
        skipTour: markDone,
        completeTour: markDone,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>')
  return ctx
}
