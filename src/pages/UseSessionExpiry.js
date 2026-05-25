import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useSessionExpiry(minutes = 30) {
  const navigate = useNavigate()

  useEffect(() => {
    let timer

    function resetTimer() {
      clearTimeout(timer)
      timer = setTimeout(() => {
        localStorage.removeItem('user')
        navigate('/login')
        alert('Your session has expired. Please login again.')
      }, minutes * 60 * 1000)
    }

    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keypress', resetTimer)
    window.addEventListener('click', resetTimer)
    resetTimer()

    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keypress', resetTimer)
      window.removeEventListener('click', resetTimer)
    }
  }, [navigate, minutes])
}