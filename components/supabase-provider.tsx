'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type SupabaseContextType = {
  user: User | null
  session: Session | null
}

const SupabaseContext = createContext<SupabaseContextType>({ user: null, session: null })

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user)
        setSession(session)
      } else {
        setUser(null)
        setSession(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <SupabaseContext.Provider value={{ user, session }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => useContext(SupabaseContext)

