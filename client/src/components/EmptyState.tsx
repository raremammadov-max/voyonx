export default function EmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 bg-background/80 backdrop-blur-sm">

      <div className="text-5xl mb-4">
        😔
      </div>

      <h2 className="text-lg font-semibold">
        Локации не найдены
      </h2>

      <p className="text-sm text-muted-foreground mt-2 max-w-xs">
        В этой категории пока пусто.
      </p>

      {onReset && (
        <button
          onClick={onReset}
          className="mt-5 px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:opacity-90"
        >
          Показать все
        </button>
      )}
    </div>
  );
}
