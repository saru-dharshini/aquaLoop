/**
 * AuthContext — AquaLoop Phase 2
 *
 * Provides real authentication state throughout the app.
 *
 * Security architecture:
 *   - JWT is stored exclusively in an HTTP-only cookie by the server.
 *   - The client NEVER reads, writes, or stores JWT tokens in localStorage or sessionStorage.
 *   - Session restoration occurs on mount via GET /api/v1/auth/me.
 *   - All user stats, XP, and roles are server-computed and trusted only from the server.
 */
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)

const initialState = {
  user: null,          // { _id, username, email, role, level, xp, streak, badges, ... }
  isAuthenticated: false,
  isLoading: true,     // Initial check in progress
  error: null,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload || null,
      }
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  /**
   * Check existing session on mount
   */
  const checkSession = useCallback(async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data?.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user })
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: null })
      }
    } catch {
      // 401 or network error on mount means unauthenticated guest
      dispatch({ type: 'AUTH_FAILURE', payload: null })
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  /**
   * Log in with email and password
   */
  const login = useCallback(async ({ email, password }) => {
    dispatch({ type: 'AUTH_LOADING' })
    try {
      const response = await api.post('/auth/login', { email, password })
      const user = response.data.user
      dispatch({ type: 'AUTH_SUCCESS', payload: user })
      return { success: true, user }
    } catch (err) {
      const message = err.userMessage || 'Sign in failed. Please check your credentials.'
      dispatch({ type: 'AUTH_FAILURE', payload: message })
      return { success: false, error: message }
    }
  }, [])

  /**
   * Register a new citizen account
   */
  const register = useCallback(async ({ username, email, password }) => {
    dispatch({ type: 'AUTH_LOADING' })
    try {
      const response = await api.post('/auth/register', { username, email, password })
      const user = response.data.user
      dispatch({ type: 'AUTH_SUCCESS', payload: user })
      return { success: true, user }
    } catch (err) {
      const message = err.userMessage || 'Registration failed. Please check your details.'
      dispatch({ type: 'AUTH_FAILURE', payload: message })
      return { success: false, error: message }
    }
  }, [])

  /**
   * Sign out and clear server-side HTTP-only cookie
   */
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.warn('Logout request failed on server:', err.message)
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' })
    }
  }, [])

  /**
   * Refresh current user data from server (e.g. after action or profile change)
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data?.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user })
      }
    } catch (err) {
      if (err.response?.status === 401) {
        dispatch({ type: 'AUTH_LOGOUT' })
      }
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
