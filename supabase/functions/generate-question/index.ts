import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface QuestionRequest {
  theme: string;
  difficulty: string;
  ageGroup: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { theme, difficulty, ageGroup } = await req.json() as QuestionRequest;
    
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
Responda APENAS no formato JSON especificado, sem texto adicional.`;

    const userPrompt = `Gere uma pergunta para o jogo "Torta na Cara" com as seguintes características:
- Tema: ${theme}
- Dificuldade: ${difficultyDescriptions[difficulty] || difficulty}
- Faixa etária: ${ageDescriptions[ageGroup] || ageGroup}

A pergunta deve ser apropriada para a idade e o nível de dificuldade.
Não use perguntas ofensivas, violentas ou inapropriadas.

Responda EXATAMENTE neste formato JSON:
{
  "pergunta": "texto da pergunta aqui",
  "resposta": "resposta curta e objetiva aqui"
}`;

    console.log("Generating question for:", { theme, difficulty, ageGroup });

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
        temperature: 0.8,
        max_tokens: 500,
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

    console.log("AI response:", content);

    // Parse the JSON response from AI
    // Handle potential markdown code blocks
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

    const questionData = JSON.parse(jsonContent);

    return new Response(
      JSON.stringify({
        pergunta: questionData.pergunta,
        resposta: questionData.resposta,
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
