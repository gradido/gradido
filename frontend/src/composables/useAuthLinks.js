import { useRoute } from 'vue-router'

export function useAuthLinks() {
  const { params } = useRoute()

  const login = () => {
    if (params.code) return '/login/' + params.code
    return '/login'
  }
  const register = () => {
    if (params.code) return '/register/' + params.code
    return '/register'
  }

  return {
    login,
    register,
  }
}
