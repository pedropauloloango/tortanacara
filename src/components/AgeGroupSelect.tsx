import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AgeGroupSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const ageGroups = [
  { value: "crianca", label: "👶 Criança", description: "6 a 12 anos" },
  { value: "adolescente", label: "🧑 Adolescente", description: "13 a 17 anos" },
  { value: "adulto", label: "👨 Adulto", description: "18+ anos" },
];

export function AgeGroupSelect({ value, onValueChange }: AgeGroupSelectProps) {
  return (
    <div className="space-y-2">
      <Label className="text-lg font-display font-semibold text-foreground">
        Faixa Etária
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-14 text-lg bg-card border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <SelectValue placeholder="Escolha a faixa etária" />
        </SelectTrigger>
        <SelectContent>
          {ageGroups.map((age) => (
            <SelectItem 
              key={age.value} 
              value={age.value}
              className="text-lg py-3"
            >
              <span>{age.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
