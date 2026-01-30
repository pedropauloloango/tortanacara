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
  pergunta: string;
  resposta: string;
}

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

    // Check if there are unused questions for this combination
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('perguntas')
      .select('id, pergunta, resposta')
      .eq('tema', theme)
      .eq('nivel', difficulty)
      .eq('faixa_etaria', ageGroup)
      .eq('usada', false)
      .limit(1);

    if (fetchError) {
      console.error("Error fetching questions:", fetchError);
      throw new Error("Erro ao buscar perguntas do banco");
    }

    // If there's an unused question, return it and mark as used
    if (existingQuestions && existingQuestions.length > 0) {
      const question = existingQuestions[0];
      
      // Mark as used
      const { error: updateError } = await supabase
        .from('perguntas')
        .update({ usada: true })
        .eq('id', question.id);

      if (updateError) {
        console.error("Error marking question as used:", updateError);
      }

      console.log("Returning existing question from database:", question.id);
      
      return new Response(
        JSON.stringify({
          pergunta: question.pergunta,
          resposta: question.resposta,
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
  {"pergunta": "texto da pergunta 1", "resposta": "resposta 1"},
  {"pergunta": "texto da pergunta 2", "resposta": "resposta 2"},
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

    const questions: GeneratedQuestion[] = JSON.parse(jsonContent);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid response format from AI");
    }

    console.log(`Parsed ${questions.length} questions, saving to database...`);

    // Save all questions to database
    const questionsToInsert = questions.map(q => ({
      tema: theme,
      nivel: difficulty,
      faixa_etaria: ageGroup,
      pergunta: q.pergunta,
      resposta: q.resposta,
      usada: false
    }));

    const { error: insertError } = await supabase
      .from('perguntas')
      .insert(questionsToInsert);

    if (insertError) {
      console.error("Error inserting questions:", insertError);
      throw new Error("Erro ao salvar perguntas no banco");
    }

    console.log("Questions saved successfully!");

    // Return the first question and mark it as used
    const firstQuestion = questions[0];
    
    // Get the ID of the first inserted question and mark as used
    const { data: insertedQuestion, error: getError } = await supabase
      .from('perguntas')
      .select('id')
      .eq('tema', theme)
      .eq('nivel', difficulty)
      .eq('faixa_etaria', ageGroup)
      .eq('pergunta', firstQuestion.pergunta)
      .eq('usada', false)
      .limit(1)
      .single();

    if (!getError && insertedQuestion) {
      await supabase
        .from('perguntas')
        .update({ usada: true })
        .eq('id', insertedQuestion.id);
    }

    return new Response(
      JSON.stringify({
        pergunta: firstQuestion.pergunta,
        resposta: firstQuestion.resposta,
        fromCache: false,
        batchGenerated: questions.length
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
