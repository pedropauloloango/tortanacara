import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ThemeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const themes = [
  { value: "geral", label: "🎲 Geral" },
  { value: "futebol", label: "⚽ Futebol" },
  { value: "culinaria", label: "🍳 Culinária" },
  { value: "ciencias", label: "🔬 Ciências" },
  { value: "historia", label: "📜 História" },
  { value: "geografia", label: "🌍 Geografia" },
  { value: "musica", label: "🎵 Música" },
  { value: "filmes", label: "🎬 Filmes" },
  { value: "animais", label: "🐾 Animais" },
  { value: "esportes", label: "🏆 Esportes" },
];

export function ThemeSelect({ value, onValueChange }: ThemeSelectProps) {
  return (
    <div className="space-y-2">
      <Label className="text-lg font-display font-semibold text-foreground">
        Tema
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-14 text-lg bg-card border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <SelectValue placeholder="Escolha um tema" />
        </SelectTrigger>
        <SelectContent>
          {themes.map((theme) => (
            <SelectItem 
              key={theme.value} 
              value={theme.value}
              className="text-lg py-3"
            >
              {theme.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
