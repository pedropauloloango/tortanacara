import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RotateCcw, Loader2 } from "lucide-react";

export function ResetQuestionsDialog() {
  const [open, setOpen] = useState(false);
  const [usedCount, setUsedCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchUsedCount = async () => {
    setIsLoading(true);
    try {
      const { count, error } = await supabase
        .from('perguntas')
        .select('*', { count: 'exact', head: true })
        .eq('usada', true);

      if (error) throw error;
      setUsedCount(count ?? 0);
    } catch (error) {
      console.error("Error fetching count:", error);
      toast({
        title: "Erro",
        description: "Não foi possível contar as perguntas usadas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchUsedCount();
    } else {
      setUsedCount(null);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const { error } = await supabase
        .from('perguntas')
        .update({ usada: false })
        .eq('usada', true);

      if (error) throw error;

      toast({
        title: "Perguntas resetadas! 🔄",
        description: `${usedCount} perguntas foram marcadas como não usadas.`,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error resetting questions:", error);
      toast({
        title: "Erro",
        description: "Não foi possível resetar as perguntas.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-primary/30 hover:border-primary/50"
        >
          <RotateCcw className="h-4 w-4" />
          Resetar Perguntas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Resetar Perguntas Usadas
          </DialogTitle>
          <DialogDescription className="text-base">
            Isso irá marcar todas as perguntas como "não usadas", permitindo que
            elas apareçam novamente no jogo.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Contando perguntas...</span>
            </div>
          ) : usedCount !== null ? (
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-3xl font-display font-bold text-primary">
                {usedCount}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {usedCount === 1 
                  ? "pergunta será marcada como não usada"
                  : "perguntas serão marcadas como não usadas"}
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isResetting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReset}
            disabled={isResetting || usedCount === 0 || usedCount === null}
            className="fun-gradient text-primary-foreground"
          >
            {isResetting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetando...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Confirmar Reset
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
