interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_MAP = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
} as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function Avatar({ src, name, size = "md" }: AvatarProps) {
  const px = SIZE_MAP[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "Avatar"}
        width={px}
        height={px}
        className="rounded-full object-cover"
        style={{ width: px, height: px }}
      />
    );
  }

  const initials = name ? getInitials(name) : "?";
  const fontSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : size === "lg" ? "text-base" : "text-xl";

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-800 ${fontSize}`}
      style={{ width: px, height: px }}
    >
      {initials}
    </div>
  );
}
