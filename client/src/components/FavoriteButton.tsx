type Props = {
  active: boolean;
  onClick: () => void;
};

export default function FavoriteButton({ active, onClick }: Props) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="text-xl leading-none"
      title="Добавить в избранное"
      aria-label="Favorite"
    >
      {active ? "💖" : "💛"}
    </button>
  );
}
