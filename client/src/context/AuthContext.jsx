/**
 * AuthContext — Phase 1 stub
 *
 * Provides authentication state throughout the app.
 * In Phase 1: always returns unauthenticated (no API calls).
 * Phase 2 will implement JWT / cookie auth against /api/v1/auth.
 *
 * NOTE: JWT is stored in an httpOnly cookie set by the server.
 *       The client NEVER reads or writes JWT directly.
 *       The client NEVER stores XP or role values for trust.
 */
import { createContext, useContext, useReducer, useCallback } from 'react'

const AuthContext = createContext(null)

const initialState = {
  user: null,        // { _id, username, email, role, level, xp, badges, ... }
  isAuthenticated: false,
  isLoading: false,  // true during /auth/me check on mount (Phase 2)
  error: null,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null }
    case 'AUTH_SUCCESS':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false, error: null }
    case 'AUTH_FAILURE':
      return { ...state, user: null, isAuthenticated: false, isLoading: false, error: action.payload }
    case 'AUTH_LOGOUT':
      return { ...initialState }
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Phase 2: replace stubs with real Axios calls
  const login = useCallback(async (_credentials) => {
    // TODO Phase 2: POST /api/v1/auth/login → server sets httpOnly cookie
    dispatch({ type: 'AUTH_FAILURE', payload: 'Auth not implemented yet (Phase 2)' })
  }, [])

  const register = useCallback(async (_data) => {
    // TODO Phase 2: POST /api/v1/auth/register
    dispatch({ type: 'AUTH_FAILURE', payload: 'Auth not implemented yet (Phase 2)' })
  }, [])

  const logout = useCallback(async () => {
    // TODO Phase 2: POST /api/v1/auth/logout → server clears cookie
    dispatch({ type: 'AUTH_LOGOUT' })
  }, [])

  const refreshUser = useCallback(async () => {
    // TODO Phase 2: GET /api/v1/auth/me → update user from server
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
