"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useState } from "react"
import { HeaderGoBack } from "../components/header-go-back"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [isEmailSent, setIsEmailSent] = useState(false)

  async function handleSignInWithMagicLink() {
    const supabase = createClient()

    if (!supabase) {
      throw new Error("Supabase is not configured")
    }

    // Validate KSU email domain
    if (!email.endsWith('@kennesaw.edu')) {
      setError('Please use your @kennesaw.edu email address')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      setIsEmailSent(true)
    } catch (err: unknown) {
      console.error('Error sending magic link:', err)
      setError(
        (err as Error).message ||
          'An unexpected error occurred. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background flex h-dvh w-full flex-col">
      <HeaderGoBack href="/" />

      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-foreground text-3xl font-medium tracking-tight sm:text-4xl">
              Welcome to Parley
            </h1>
            <p className="text-muted-foreground mt-3">
              KSU's AI conversation platform for faculty and staff research collaboration.
            </p>
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}
          {!isEmailSent ? (
            <div className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  KSU Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.name@kennesaw.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
              <Button
                className="w-full text-base sm:text-base"
                size="lg"
                onClick={handleSignInWithMagicLink}
                disabled={isLoading || !email}
              >
                {isLoading ? "Sending..." : "Send Magic Link"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Only @kennesaw.edu email addresses are supported
              </p>
            </div>
          ) : (
            <div className="mt-8 text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 font-medium mb-2">Check your email</h3>
                <p className="text-green-700 text-sm">
                  We've sent a magic link to <strong>{email}</strong>. 
                  Click the link in your email to sign in.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEmailSent(false)
                  setEmail("")
                  setError(null)
                }}
              >
                Use different email
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="text-muted-foreground py-6 text-center text-sm">
        {/* @todo */}
        <p>
          Kennesaw State University - Office of Research{" "}
          <br />
          <Link href="/" className="text-foreground hover:underline">
            Terms of Use
          </Link>{" "}
          |{" "}
          <Link href="/" className="text-foreground hover:underline">
            Privacy Notice
          </Link>
        </p>
      </footer>
    </div>
  )
}
