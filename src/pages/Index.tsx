import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GameHeader } from "@/components/GameHeader";
import { ThemeSelect } from "@/components/ThemeSelect";
import { DifficultySelect } from "@/components/DifficultySelect";
import { AgeGroupSelect } from "@/components/AgeGroupSelect";
import { QuestionCard } from "@/components/QuestionCard";
import { ResetQuestionsDialog } from "@/components/ResetQuestionsDialog";
import { useQuestionGenerator } from "@/hooks/useQuestionGenerator";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";

const Index = () => {
  const [theme, setTheme] = useState("geral");
  const [difficulty, setDifficulty] = useState("medio");
  const [ageGroup, setAgeGroup] = useState("adulto");

  const { question, isLoading, stats, generateQuestion } = useQuestionGenerator();

  const handleGenerate = () => {
    generateQuestion({ theme, difficulty, ageGroup });
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <GameHeader />

        {/* Filters Card */}
        <div className="game-card space-y-6">
          <h2 className="text-xl font-display font-semibold text-foreground">
            Configure sua pergunta
          </h2>
          
          <div className="grid gap-6 sm:grid-cols-3">
            <ThemeSelect value={theme} onValueChange={setTheme} />
            <DifficultySelect value={difficulty} onValueChange={setDifficulty} />
            <AgeGroupSelect value={ageGroup} onValueChange={setAgeGroup} />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            size="lg"
            className="w-full h-16 text-xl font-display font-bold fun-gradient text-primary-foreground hover:opacity-90 shadow-fun hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Gerando...
              </>
            ) : question ? (
              <>
                <RefreshCw className="mr-3 h-6 w-6" />
                Próxima Pergunta
              </>
            ) : (
              <>
                <Sparkles className="mr-3 h-6 w-6" />
                Gerar Pergunta
              </>
            )}
          </Button>
        </div>

        {/* Question Display */}
        {question && (
          <div className="space-y-4">
            <QuestionCard 
              pergunta={question.pergunta} 
              resposta={question.resposta} 
            />
            {stats && (
              <p className="text-center text-sm text-muted-foreground">
                {stats.fromCache ? "📦 Do estoque" : `✨ Lote de ${stats.batchGenerated} perguntas gerado`}
              </p>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="game-card text-center py-12">
            <div className="inline-flex items-center justify-center p-4 rounded-full fun-gradient animate-pulse-soft mb-4">
              <Loader2 className="h-10 w-10 text-primary-foreground animate-spin" />
            </div>
            <p className="text-xl font-display text-muted-foreground">
              Preparando sua pergunta...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!question && !isLoading && (
          <div className="game-card text-center py-12 border-2 border-dashed border-primary/30">
            <div className="text-6xl mb-4">🥧</div>
            <p className="text-xl font-display text-muted-foreground">
              Clique no botão acima para gerar uma pergunta!
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center space-y-4 pt-8">
          <ResetQuestionsDialog />
          <p className="text-sm text-muted-foreground">
            Perguntas geradas por IA • Divirta-se com responsabilidade! 🎉
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
