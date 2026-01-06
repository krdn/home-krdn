import { cn } from "@/lib/utils";

interface TechBadgeProps {
  tech: string;
  size?: "sm" | "md";
}

const techColors: Record<string, string> = {
  "Next.js": "bg-black text-white",
  "React": "bg-cyan-500/20 text-cyan-400",
  "TypeScript": "bg-blue-500/20 text-blue-400",
  "Node.js": "bg-green-500/20 text-green-400",
  "Python": "bg-yellow-500/20 text-yellow-400",
  "FastAPI": "bg-teal-500/20 text-teal-400",
  "Django": "bg-green-600/20 text-green-500",
  "MongoDB": "bg-green-500/20 text-green-400",
  "PostgreSQL": "bg-blue-600/20 text-blue-400",
  "Redis": "bg-red-500/20 text-red-400",
  "Docker": "bg-blue-500/20 text-blue-400",
  "Prisma": "bg-indigo-500/20 text-indigo-400",
  "TipTap": "bg-purple-500/20 text-purple-400",
  "Claude API": "bg-orange-500/20 text-orange-400",
  "OpenAI": "bg-emerald-500/20 text-emerald-400",
  "LangChain": "bg-teal-500/20 text-teal-400",
  "Celery": "bg-lime-500/20 text-lime-400",
  "Streamlit": "bg-red-500/20 text-red-400",
  "Jest": "bg-red-600/20 text-red-500",
  "Svelte": "bg-orange-500/20 text-orange-400",
};

export function TechBadge({ tech, size = "md" }: TechBadgeProps) {
  const colorClass = techColors[tech] || "bg-secondary text-secondary-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium",
        colorClass,
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm"
      )}
    >
      {tech}
    </span>
  );
}
