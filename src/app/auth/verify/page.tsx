export default function VerifyPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="font-display text-3xl font-bold gradient-text mb-3">Check your email</h1>
        <p className="text-white/60">
          We've sent a magic link to your inbox. Click it to sign in to Moonshot instantly — no password needed.
        </p>
        <p className="text-white/30 text-sm mt-4">The link expires in 24 hours.</p>
      </div>
    </div>
  )
}
