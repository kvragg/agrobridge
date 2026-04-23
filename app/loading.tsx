export default function GlobalLoading() {
  return (
    <div
      role="status"
      aria-label="Carregando"
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.12)",
          borderTopColor: "var(--green, #4ea884)",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span style={{ position: "absolute", left: -9999 }}>Carregando…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
