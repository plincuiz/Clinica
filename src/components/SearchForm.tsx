export function SearchForm({ placeholder, current }: { placeholder: string; current: string }) {
  return (
    <form method="get" className="flex gap-2 items-center print:hidden">
      <input
        name="q"
        defaultValue={current}
        placeholder={placeholder}
        className="border rounded px-3 py-2 w-64"
      />
      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Buscar</button>
      {current && (
        <a href="?" className="text-sm text-slate-600 hover:underline">Limpiar</a>
      )}
    </form>
  )
}
