import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Sudoku Teacher
        </h1>
        <p className="text-center mb-8">
          Learn Sudoku strategies while you play!
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/play"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
          >
            Start Playing
          </Link>
        </div>
      </div>
    </main>
  )
}
