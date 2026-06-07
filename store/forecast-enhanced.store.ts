/**
 * Enhanced Forecast Store - Combines existing store with SupplyMind AI features
 * Uses Zustand for state management across all forecast-related data
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import {
  EnhancedForecast,
  ForecastAlgorithm,
  SimulationInput,
  DashboardData,
  ConversationState,
  ChatMessage,
  KPIMetrics,
} from '@/types/forecast-enhanced.types'

interface ForecastState {
  // Core forecast data
  forecasts: EnhancedForecast[]
  selectedForecast: EnhancedForecast | null
  selectedAlgorithm: ForecastAlgorithm

  // Dashboard
  dashboardData: DashboardData | null
  kpis: KPIMetrics | null

  // Business simulation
  simulationInput: SimulationInput
  simulationResults: any | null
  isSimulating: boolean

  // AI Chat
  conversation: ConversationState
  isLoadingAI: boolean

  // Filters and UI
  selectedCategory: string | null
  selectedRegion: string | null
  dateRange: { start: Date; end: Date } | null
  isLoading: boolean
  error: string | null

  // Analytics
  showAnalytics: boolean
  analyticsView: 'product' | 'category' | 'seasonal' | 'accuracy'

  // Actions
  addForecast: (forecast: EnhancedForecast) => void
  removeForecast: (id: string) => void
  setSelectedForecast: (forecast: EnhancedForecast | null) => void
  setAlgorithm: (algorithm: ForecastAlgorithm) => void

  // Dashboard actions
  setDashboardData: (data: DashboardData) => void
  setKPIs: (kpis: KPIMetrics) => void
  refreshDashboard: () => Promise<void>

  // Simulation actions
  setSimulationInput: (input: Partial<SimulationInput>) => void
  runSimulation: (input: SimulationInput) => Promise<void>
  getSimulationResults: () => any

  // AI Chat actions
  addMessage: (message: ChatMessage) => void
  askAssistant: (question: string) => Promise<string>
  setConversationContext: (context: any) => void
  clearConversation: () => void

  // Filter actions
  setCategory: (category: string | null) => void
  setRegion: (region: string | null) => void
  setDateRange: (start: Date, end: Date) => void

  // UI actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setAnalyticsView: (view: 'product' | 'category' | 'seasonal' | 'accuracy') => void

  // Utility
  reset: () => void
}

const initialSimulationInput: SimulationInput = {
  baseForecast: 0,
  discountPercent: 0,
  marketingPercent: 0,
  festivalPercent: 0,
  supplyConstraintPercent: 0,
}

const initialConversation: ConversationState = {
  messages: [],
  context: {
    analysisMode: 'general',
  },
  isLoading: false,
}

export const useForecastStore = create<ForecastState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        forecasts: [],
        selectedForecast: null,
        selectedAlgorithm: ForecastAlgorithm.ENSEMBLE,
        dashboardData: null,
        kpis: null,
        simulationInput: initialSimulationInput,
        simulationResults: null,
        isSimulating: false,
        conversation: initialConversation,
        isLoadingAI: false,
        selectedCategory: null,
        selectedRegion: null,
        dateRange: null,
        isLoading: false,
        error: null,
        showAnalytics: false,
        analyticsView: 'product',

        // Forecast actions
        addForecast: (forecast: EnhancedForecast) =>
          set((state) => ({
            forecasts: [forecast, ...state.forecasts],
          })),

        removeForecast: (id: string) =>
          set((state) => ({
            forecasts: state.forecasts.filter((f) => f.id !== id),
          })),

        setSelectedForecast: (forecast: EnhancedForecast | null) =>
          set({ selectedForecast: forecast }),

        setAlgorithm: (algorithm: ForecastAlgorithm) =>
          set({ selectedAlgorithm: algorithm }),

        // Dashboard actions
        setDashboardData: (data: DashboardData) =>
          set({ dashboardData: data }),

        setKPIs: (kpis: KPIMetrics) =>
          set({ kpis }),

        refreshDashboard: async () => {
          set({ isLoading: true })
          try {
            // Call your API to fetch dashboard data
            const response = await fetch('/api/dashboard')
            const data = await response.json()
            set({ dashboardData: data, isLoading: false })
          } catch (error) {
            set({ error: 'Failed to refresh dashboard', isLoading: false })
          }
        },

        // Simulation actions
        setSimulationInput: (input: Partial<SimulationInput>) =>
          set((state) => ({
            simulationInput: {
              ...state.simulationInput,
              ...input,
            },
          })),

        runSimulation: async (input: SimulationInput) => {
          set({ isSimulating: true })
          try {
            const response = await fetch('/api/forecast/simulate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(input),
            })
            const results = await response.json()
            set({ simulationResults: results, isSimulating: false })
          } catch (error) {
            set({ error: 'Simulation failed', isSimulating: false })
          }
        },

        getSimulationResults: () => get().simulationResults,

        // AI Chat actions
        addMessage: (message: ChatMessage) =>
          set((state) => ({
            conversation: {
              ...state.conversation,
              messages: [...state.conversation.messages, message],
            },
          })),

        askAssistant: async (question: string) => {
          const state = get()

          // Add user message
          const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: question,
            timestamp: new Date().toISOString(),
            context: state.conversation.context,
          }
          set((s) => ({
            conversation: {
              ...s.conversation,
              messages: [...s.conversation.messages, userMessage],
              isLoading: true,
            },
            isLoadingAI: true,
          }))

          try {
            // Call your Gemini AI API endpoint
            const response = await fetch('/api/ai/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: question,
                context: state.conversation.context,
                forecastId: state.selectedForecast?.id,
              }),
            })
            const data = await response.json()

            // Add assistant response
            const assistantMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: data.response,
              timestamp: new Date().toISOString(),
            }

            set((s) => ({
              conversation: {
                ...s.conversation,
                messages: [...s.conversation.messages, assistantMessage],
                isLoading: false,
              },
              isLoadingAI: false,
            }))

            return data.response
          } catch (error) {
            set((s) => ({
              conversation: {
                ...s.conversation,
                isLoading: false,
              },
              isLoadingAI: false,
              error: 'AI response failed',
            }))
            return 'Sorry, I encountered an error. Please try again.'
          }
        },

        setConversationContext: (context: any) =>
          set((state) => ({
            conversation: {
              ...state.conversation,
              context: {
                ...state.conversation.context,
                ...context,
              },
            },
          })),

        clearConversation: () =>
          set((state) => ({
            conversation: {
              ...state.conversation,
              messages: [],
            },
          })),

        // Filter actions
        setCategory: (category: string | null) =>
          set({ selectedCategory: category }),

        setRegion: (region: string | null) =>
          set({ selectedRegion: region }),

        setDateRange: (start: Date, end: Date) =>
          set({ dateRange: { start, end } }),

        // UI actions
        setLoading: (loading: boolean) =>
          set({ isLoading: loading }),

        setError: (error: string | null) =>
          set({ error }),

        setAnalyticsView: (view: 'product' | 'category' | 'seasonal' | 'accuracy') =>
          set({ analyticsView: view }),

        // Utility
        reset: () =>
          set({
            forecasts: [],
            selectedForecast: null,
            dashboardData: null,
            kpis: null,
            simulationInput: initialSimulationInput,
            simulationResults: null,
            conversation: initialConversation,
            selectedCategory: null,
            selectedRegion: null,
            dateRange: null,
            error: null,
          }),
      }),
      {
        name: 'forecast-store', // persist to localStorage
        partialize: (state) => ({
          forecasts: state.forecasts,
          selectedAlgorithm: state.selectedAlgorithm,
          selectedCategory: state.selectedCategory,
          selectedRegion: state.selectedRegion,
          analyticsView: state.analyticsView,
        }),
      }
    )
  )
)

// Derived selectors for common use cases
export const useSelectedForecast = () =>
  useForecastStore((state) => state.selectedForecast)

export const useSimulationData = () =>
  useForecastStore((state) => ({
    input: state.simulationInput,
    results: state.simulationResults,
    isSimulating: state.isSimulating,
  }))

export const useChatState = () =>
  useForecastStore((state) => ({
    messages: state.conversation.messages,
    isLoading: state.conversation.isLoading,
    isLoadingAI: state.isLoadingAI,
  }))

export const useDashboard = () =>
  useForecastStore((state) => ({
    dashboardData: state.dashboardData,
    kpis: state.kpis,
    isLoading: state.isLoading,
  }))

export const useFilters = () =>
  useForecastStore((state) => ({
    category: state.selectedCategory,
    region: state.selectedRegion,
    dateRange: state.dateRange,
  }))
