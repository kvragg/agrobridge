export default async function EntrevistaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Entrevista</h1>
      <p className="text-muted-foreground">Processo: {id}</p>
      <p className="text-muted-foreground">Chat em construção</p>
    </div>
  )
}
