// stores/authStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State
  const accessToken = ref(null)
  const tokenExpiry = ref(null)
  const isAuthenticated = ref(false)

  // Getters
  const hasValidToken = () => {
    return accessToken.value && tokenExpiry.value > Date.now()
  }

  // Actions
  const setToken = (tokenData) => {
    accessToken.value = tokenData.access_token
    tokenExpiry.value = Date.now() + (tokenData.expires_in * 1000)
    isAuthenticated.value = true
  }

  const logout = () => {
    accessToken.value = null
    tokenExpiry.value = null
    isAuthenticated.value = false
  }

  return {
    // State
    accessToken,
    tokenExpiry,
    isAuthenticated,
    
    // Getters
    hasValidToken,
    
    // Actions
    setToken,
    logout
  }
})