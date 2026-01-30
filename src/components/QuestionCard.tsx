import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface QuestionCardProps {
  pergunta: string;
  resposta: string;
}

export function QuestionCard({ pergunta, resposta }: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="game-card animate-bounce-in space-y-8">
      <div className="space-y-4">
        <span className="inline-block px-4 py-1 bg-primary/20 text-primary-foreground rounded-full text-sm font-semibold">
          Pergunta
        </span>
        <p className="question-text text-foreground">
          {pergunta}
        </p>
      </div>

      <div className="pt-4 border-t border-border">
        {showAnswer ? (
          <div className="animate-fade-up space-y-4">
            <span className="inline-block px-4 py-1 bg-accent/20 text-accent rounded-full text-sm font-semibold">
              Resposta
            </span>
            <p className="answer-text">
              {resposta}
            </p>
            <Button
              onClick={() => setShowAnswer(false)}
              variant="ghost"
              className="mt-4 text-muted-foreground hover:text-foreground"
            >
              <EyeOff className="mr-2 h-5 w-5" />
              Esconder Resposta
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setShowAnswer(true)}
            variant="secondary"
            size="lg"
            className="w-full h-14 text-lg font-semibold shadow-button hover:scale-[1.02] transition-transform"
          >
            <Eye className="mr-2 h-5 w-5" />
            Mostrar Resposta
          </Button>
        )}
      </div>
    </div>
  );
}
