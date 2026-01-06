import {
  Box,
  FileText,
  Code,
  Linkedin,
  FlaskConical,
  LayoutDashboard,
  Wand2,
  Newspaper,
  Workflow,
  MessageSquare,
  Terminal,
  Send,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Box,
  FileText,
  Code,
  Linkedin,
  FlaskConical,
  LayoutDashboard,
  Wand2,
  Newspaper,
  Workflow,
  MessageSquare,
  Terminal,
  Send,
};

export function getIcon(name?: string): LucideIcon {
  if (!name) return Box;
  return iconMap[name] || Box;
}
