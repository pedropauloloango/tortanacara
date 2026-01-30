import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Question {
  pergunta: string;
  resposta: string;
}

interface GenerateParams {
  theme: string;
  difficulty: string;
  ageGroup: string;
}

export function useQuestionGenerator() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateQuestion = async ({ theme, difficulty, ageGroup }: GenerateParams) => {
    setIsLoading(true);
    setQuestion(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-question', {
        body: { theme, difficulty, ageGroup }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setQuestion({
        pergunta: data.pergunta,
        resposta: data.resposta,
      });

    } catch (error) {
      console.error("Error generating question:", error);
      
      let errorMessage = "Erro ao gerar pergunta. Tente novamente.";
      
      if (error instanceof Error) {
        if (error.message.includes("429") || error.message.includes("rate")) {
          errorMessage = "Muitas requisições. Aguarde alguns segundos.";
        } else if (error.message.includes("402") || error.message.includes("payment")) {
          errorMessage = "Créditos insuficientes.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Ops! 🥧",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearQuestion = () => {
    setQuestion(null);
  };

  return {
    question,
    isLoading,
    generateQuestion,
    clearQuestion,
  };
}
