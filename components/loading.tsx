export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    </div>
  )
}
