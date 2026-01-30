import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DifficultySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const difficulties = [
  { value: "facil", label: "😊 Fácil", description: "Perguntas simples" },
  { value: "medio", label: "🤔 Médio", description: "Um pouco mais desafiador" },
  { value: "dificil", label: "🧠 Difícil", description: "Para os experts!" },
];

export function DifficultySelect({ value, onValueChange }: DifficultySelectProps) {
  return (
    <div className="space-y-2">
      <Label className="text-lg font-display font-semibold text-foreground">
        Dificuldade
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-14 text-lg bg-card border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <SelectValue placeholder="Escolha a dificuldade" />
        </SelectTrigger>
        <SelectContent>
          {difficulties.map((diff) => (
            <SelectItem 
              key={diff.value} 
              value={diff.value}
              className="text-lg py-3"
            >
              <span>{diff.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
