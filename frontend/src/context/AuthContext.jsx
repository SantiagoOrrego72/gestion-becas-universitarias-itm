import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('becas_user')) }
    catch { return null }
  })

  const login = useCallback((token, usuario) => {
    localStorage.setItem('becas_token', token)
    localStorage.setItem('becas_user', JSON.stringify(usuario))
    setUser(usuario)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('becas_token')
    localStorage.removeItem('becas_user')
    setUser(null)
  }, [])

  const updateUser = useCallback((partial) => {
    setUser(prev => {
      const updated = { ...prev, ...partial }
      localStorage.setItem('becas_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
