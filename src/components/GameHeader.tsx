import { Cake } from "lucide-react";

export function GameHeader() {
  return (
    <header className="text-center space-y-4 mb-8">
      <div className="inline-flex items-center justify-center gap-3 animate-bounce-in">
        <div className="p-3 rounded-2xl fun-gradient shadow-fun">
          <Cake className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground">
          Torta na Cara
        </h1>
        <div className="p-3 rounded-2xl fun-gradient shadow-fun">
          <Cake className="h-10 w-10 text-primary-foreground" />
        </div>
      </div>
      <p className="text-lg md:text-xl text-muted-foreground font-medium animate-fade-up">
        Escolha o tema, dificuldade e faixa etária para gerar perguntas!
      </p>
    </header>
  );
}
