import { Fragment } from "react";
import { config } from "@/lib/book";
import {
  Info,
  Lightbulb as BulbIcon,
  AlertTriangle,
  BookOpen,
  Sun,
  Leaf,
  Moon,
  Feather,
  Globe2,
  FileCode2,
  Layers3,
  Code2,
  Menu,
  Github,
  ArrowUpRight,
  Type,
  Bold,
  Italic,
  Link2,
  ImagePlus,
  Sigma,
  Quote,
  Table2,
  List,
  Lightbulb,
  Hash,
} from "lucide-react";

export const icons = {
  info: Info,
  bulb: BulbIcon,
  warning: AlertTriangle,
  book: BookOpen,
  sun: Sun,
  leaf: Leaf,
  moon: Moon,
  feather: Feather,
  globe: Globe2,
  file: FileCode2,
  layers: Layers3,
  code: Code2,
  menu: Menu,
  github: Github,
  arrow: ArrowUpRight,
  Type,
  Bold,
  Italic,
  Link2,
  ImagePlus,
  Code2,
  Sigma,
  Layers3,
  Quote,
  Table2,
  List,
  Lightbulb,
  Hash,
};
export function ConfigIcon({
  name,
  size = config.appearance.iconSizes["18"],
}: {
  name: string;
  size?: number;
}) {
  const Icon = icons[name as keyof typeof icons] || BookOpen;
  return <Icon size={size} />;
}
export type RichSegment = {
  text?: string;
  emphasis?: boolean;
  break?: boolean;
};
export function RichText({ parts }: { parts: RichSegment[] }) {
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part.break ? (
            <br />
          ) : part.emphasis ? (
            <em>{part.text}</em>
          ) : (
            part.text
          )}
        </Fragment>
      ))}
    </>
  );
}
