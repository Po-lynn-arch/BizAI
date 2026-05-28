import { useState, useEffect } from 'react'
import { API_URL } from './config'
import { getCached, setCache } from './useCache'

export function useBusinessData(userId) {
  const [sales, setSales] = useState(getCached(`sales_${userId}`) || [])
  const [expenses, setExpenses] = useState(getCached(`expenses_${userId}`) || [])
  const [reminders, setReminders] = useState(getCached(`reminders_${userId}`) || [])
  const [weekly, setWeekly] = useState(getCached(`weekly_${userId}`) || null)
  const [predictions, setPredictions] = useState(getCached(`predictions_${userId}`) || [])
  const [loading, setLoading] = useState(
    !getCached(`sales_${userId}`) // only show loading if no cache
  )

  useEffect(() => {
    if (!userId) return

    // If all data is cached, skip fetching
    if (
      getCached(`sales_${userId}`) &&
      getCached(`expenses_${userId}`) &&
      getCached(`reminders_${userId}`)
    ) {
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([
      fetch(`${API_URL}/api/sales?user_id=${userId}`).then(r => r.json()),
      fetch(`${API_URL}/api/operational-expenses?user_id=${userId}`).then(r => r.json()),
      fetch(`${API_URL}/api/reminders?user_id=${userId}`).then(r => r.json()),
      fetch(`${API_URL}/api/weekly-report?user_id=${userId}`).then(r => r.json()),
      fetch(`${API_URL}/api/predictions?user_id=${userId}`).then(r => r.json()),
    ]).then(([salesData, expensesData, remindersData, weeklyData, predictionsData]) => {
      const s = Array.isArray(salesData) ? salesData : []
      const e = Array.isArray(expensesData) ? expensesData : []
      const r = Array.isArray(remindersData) ? remindersData : []
      const p = Array.isArray(predictionsData) ? predictionsData : []

      setSales(s); setCache(`sales_${userId}`, s)
      setExpenses(e); setCache(`expenses_${userId}`, e)
      setReminders(r); setCache(`reminders_${userId}`, r)
      setWeekly(weeklyData); setCache(`weekly_${userId}`, weeklyData)
      setPredictions(p); setCache(`predictions_${userId}`, p)
    }).catch(() => {
      setSales([]); setExpenses([]); setReminders([])
    }).finally(() => setLoading(false))
  }, [userId])

  return { sales, expenses, reminders, weekly, predictions, loading }
}