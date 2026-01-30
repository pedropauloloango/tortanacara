import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface QuestionRequest {
  theme: string;
  difficulty: string;
  ageGroup: string;
}

interface GeneratedQuestion {
  question?: string;
  answer?: string;
  pergunta?: string;
  resposta?: string;
}

interface StoredQuestion {
  id: string;
  pergunta: string;
  resposta: string;
}

const normalizeText = (value: string) => value.trim().toLowerCase();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { theme, difficulty, ageGroup } = await req.json() as QuestionRequest;
    
    // Initialize Supabase client with service role for database access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const getNextUnusedQuestion = async (): Promise<StoredQuestion | null> => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const { data: candidate, error: fetchError } = await supabase
          .from('perguntas')
          .select('id, pergunta, resposta')
          .eq('tema', theme)
          .eq('nivel', difficulty)
          .eq('faixa_etaria', ageGroup)
          .eq('usada', false)
          .order('criada_em', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching questions:", fetchError);
          throw new Error("Erro ao buscar perguntas do banco");
        }

        if (!candidate) {
          return null;
        }

        const { data: updated, error: updateError } = await supabase
          .from('perguntas')
          .update({ usada: true })
          .eq('id', candidate.id)
          .eq('usada', false)
          .select('id, pergunta, resposta')
          .single();

        if (!updateError && updated) {
          return updated as StoredQuestion;
        }

        console.warn("Question was already used, retrying...", updateError);
      }

      return null;
    };

    const existingQuestion = await getNextUnusedQuestion();

    if (existingQuestion) {
      console.log("Returning existing question from database:", existingQuestion.id);
      return new Response(
        JSON.stringify({
          pergunta: existingQuestion.pergunta,
          resposta: existingQuestion.resposta,
          fromCache: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No unused questions - generate a new batch of 20
    console.log("No unused questions found, generating batch of 20...");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Map age groups to Portuguese descriptions
    const ageDescriptions: Record<string, string> = {
      'crianca': 'crianças de 6 a 12 anos',
      'adolescente': 'adolescentes de 13 a 17 anos',
      'adulto': 'adultos com 18 anos ou mais'
    };

    // Map difficulty levels
    const difficultyDescriptions: Record<string, string> = {
      'facil': 'fácil, com perguntas simples e óbvias',
      'medio': 'médio, com perguntas que exigem algum conhecimento',
      'dificil': 'difícil, com perguntas desafiadoras que exigem conhecimento aprofundado'
    };

    const systemPrompt = `Você é um gerador de perguntas para o jogo "Torta na Cara", uma brincadeira divertida e educativa.
Você DEVE gerar perguntas adequadas para a faixa etária especificada.
Suas perguntas devem ser claras, diretas e ter uma única resposta correta.
IMPORTANTE: Cada pergunta deve ser TOTALMENTE ÚNICA - variando em contexto, formulação, assunto específico e conteúdo.
Nenhuma pergunta pode ser parecida ou equivalente semanticamente a outra.
Responda APENAS no formato JSON especificado, sem texto adicional.`;

    const userPrompt = `Gere EXATAMENTE 20 perguntas ÚNICAS para o jogo "Torta na Cara" com as seguintes características:
- Tema: ${theme}
- Dificuldade: ${difficultyDescriptions[difficulty] || difficulty}
- Faixa etária: ${ageDescriptions[ageGroup] || ageGroup}

REGRAS IMPORTANTES:
1. Cada pergunta deve abordar um aspecto DIFERENTE do tema
2. Varie os tipos de perguntas: fatos, curiosidades, definições, comparações, etc.
3. NÃO repita padrões de formulação (evite começar todas com "Qual", por exemplo)
4. As respostas devem ser curtas e objetivas (1-5 palavras)
5. Todas devem ser apropriadas para a idade selecionada
6. Não use perguntas ofensivas, violentas ou inapropriadas

Responda EXATAMENTE neste formato JSON (array de 20 objetos):
[
  {"question": "texto da pergunta 1", "answer": "resposta 1"},
  {"question": "texto da pergunta 2", "answer": "resposta 2"},
  ...
]`;

    console.log("Generating batch for:", { theme, difficulty, ageGroup });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.9,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione mais créditos à sua conta." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI response received, parsing...");

    // Parse the JSON response from AI
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent.slice(7);
    }
    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.slice(3);
    }
    if (jsonContent.endsWith("```")) {
      jsonContent = jsonContent.slice(0, -3);
    }
    jsonContent = jsonContent.trim();

    const rawQuestions: GeneratedQuestion[] = JSON.parse(jsonContent);

    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      throw new Error("Invalid response format from AI");
    }

    const uniqueQuestions: GeneratedQuestion[] = [];
    const seenQuestions = new Set<string>();

    for (const item of rawQuestions) {
      const pergunta = item.question ?? item.pergunta;
      const resposta = item.answer ?? item.resposta;

      if (!pergunta || !resposta) {
        continue;
      }

      const normalized = normalizeText(pergunta);
      if (seenQuestions.has(normalized)) {
        continue;
      }

      seenQuestions.add(normalized);
      uniqueQuestions.push({ pergunta, resposta });
    }

    if (uniqueQuestions.length === 0) {
      throw new Error("Nenhuma pergunta válida foi gerada.");
    }

    console.log(`Parsed ${uniqueQuestions.length} unique questions, saving to database...`);

    // Save all questions to database
    const questionsToInsert = uniqueQuestions.map(q => ({
      tema: theme,
      nivel: difficulty,
      faixa_etaria: ageGroup,
      pergunta: q.pergunta,
      resposta: q.resposta,
      usada: false
    }));

    const { data: insertedQuestions, error: insertError } = await supabase
      .from('perguntas')
      .insert(questionsToInsert)
      .select('id, pergunta, resposta');

    if (insertError) {
      console.error("Error inserting questions:", insertError);
      throw new Error("Erro ao salvar perguntas no banco");
    }

    console.log("Questions saved successfully!");

    // Return the first question and mark it as used
    const firstInserted = insertedQuestions?.[0];

    if (firstInserted?.id) {
      await supabase
        .from('perguntas')
        .update({ usada: true })
        .eq('id', firstInserted.id);
    }

    return new Response(
      JSON.stringify({
        pergunta: firstInserted?.pergunta ?? uniqueQuestions[0].pergunta,
        resposta: firstInserted?.resposta ?? uniqueQuestions[0].resposta,
        fromCache: false,
        batchGenerated: uniqueQuestions.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error generating question:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro ao gerar pergunta. Tente novamente." 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
