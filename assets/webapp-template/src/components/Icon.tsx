// Thin wrapper over lucide-react with a curated, name-indexed map. Course data
// and archetypes reference icons by string name; this resolves them with a
// stable fallback so an unknown name never breaks the UI.
import {
  Lightbulb, BookOpen, Network, Code2, Route, Cpu, Dumbbell, Bug, Scale, Rocket, Mic,
  Zap, Layers, Target, Compass, FlaskConical, Ruler,
  Search, Sun, Moon, Monitor, Home, Map, BarChart3, BookMarked, FolderTree,
  ChevronLeft, ChevronRight, ChevronDown, Check, CircleDot, Circle, Lock, Bookmark,
  Play, ArrowRight, Sparkles, Flame, Trophy, Download, Upload, RotateCcw, Menu, X,
  Quote, TriangleAlert, Info, PartyPopper, GraduationCap, ListChecks, Clock, Timer,
  ArrowLeftRight, FileCode, Wrench, Sprout, Leaf, ShieldCheck, Eye, EyeOff, HelpCircle,
  MapPin, Settings, Plus, Minus, User, StickyNote, ShieldAlert, MousePointerClick, Pause,
  type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  Lightbulb, BookOpen, Network, Code2, Route, Cpu, Dumbbell, Bug, Scale, Rocket, Mic,
  Zap, Layers, Target, Compass, FlaskConical, Ruler,
  Search, Sun, Moon, Monitor, Home, Map, BarChart3, BookMarked, FolderTree,
  ChevronLeft, ChevronRight, ChevronDown, Check, CircleDot, Circle, Lock, Bookmark,
  Play, ArrowRight, Sparkles, Flame, Trophy, Download, Upload, RotateCcw, Menu, X,
  Quote, TriangleAlert, Info, PartyPopper, GraduationCap, ListChecks, Clock, Timer,
  ArrowLeftRight, FileCode, Wrench, Sprout, Leaf, ShieldCheck, Eye, EyeOff, HelpCircle,
  MapPin, Settings, Plus, Minus, User, StickyNote, ShieldAlert, MousePointerClick, Pause,
};

export function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 2,
  'aria-hidden': ariaHidden = true,
}: {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  'aria-hidden'?: boolean;
}) {
  const Cmp = MAP[name] ?? Circle;
  return <Cmp size={size} className={`icon ${className ?? ''}`} strokeWidth={strokeWidth} aria-hidden={ariaHidden} />;
}

export function hasIcon(name: string): boolean {
  return name in MAP;
}
