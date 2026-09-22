import { createContext, useContext } from 'react'

export const EnvironmentContext = createContext(false)
export const useEnvironmentReady = () => useContext(EnvironmentContext)
