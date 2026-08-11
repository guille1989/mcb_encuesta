type SurveyAnswers = {
  brand_impression: string;
  visual_style_rating: string;
  trial_intent: string;
  brand_attractions: string[];
  price_willingness: string;
  purchase_at_1290: string;
  purchase_requirements: string;
};

const allowedValues = {
  brand_impression: new Set([
    "love_it",
    "like_it",
    "indifferent",
    "no_connection",
    "unclear",
  ]),
  visual_style_rating: new Set(["1", "2", "3", "4", "5"]),
  trial_intent: new Set([
    "definitely_yes",
    "probably_yes",
    "maybe",
    "probably_no",
    "no",
  ]),
  brand_attractions: new Set([
    "name",
    "logo",
    "packaging",
    "personality",
    "specialty",
    "origin_quality",
    "nothing",
  ]),
  price_willingness: new Set([
    "under_8",
    "8_10",
    "10_12",
    "12_15",
    "15_18",
    "over_18",
  ]),
  purchase_at_1290: new Set([
    "yes",
    "probably_yes",
    "maybe",
    "probably_no",
    "no",
  ]),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAnswers(value: unknown): SurveyAnswers | null {
  if (!isRecord(value)) return null;

  const singleChoiceFields = [
    "brand_impression",
    "visual_style_rating",
    "trial_intent",
    "price_willingness",
    "purchase_at_1290",
  ] as const;

  for (const field of singleChoiceFields) {
    if (typeof value[field] !== "string" || !allowedValues[field].has(value[field])) {
      return null;
    }
  }

  const attractions = value.brand_attractions;
  if (
    !Array.isArray(attractions) ||
    attractions.length === 0 ||
    attractions.some(
      (item) => typeof item !== "string" || !allowedValues.brand_attractions.has(item),
    ) ||
    new Set(attractions).size !== attractions.length ||
    (attractions.includes("nothing") && attractions.length > 1)
  ) {
    return null;
  }

  const requirements = value.purchase_requirements;
  if (
    typeof requirements !== "string" ||
    requirements.trim().length === 0 ||
    requirements.length > 800
  ) {
    return null;
  }

  return {
    brand_impression: value.brand_impression as string,
    visual_style_rating: value.visual_style_rating as string,
    trial_intent: value.trial_intent as string,
    brand_attractions: attractions as string[],
    price_willingness: value.price_willingness as string,
    purchase_at_1290: value.purchase_at_1290 as string,
    purchase_requirements: requirements.trim(),
  };
}

function getSupabaseRestUrl() {
  const configuredUrl = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  if (!configuredUrl) return null;

  const projectUrl = configuredUrl.replace(/\/rest\/v1$/, "");
  return `${projectUrl}/rest/v1/mcb_survey`;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Solicitud no válida." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return Response.json({ error: "Solicitud no válida." }, { status: 400 });
  }

  const answers = parseAnswers(body.answers);
  const responseId = body.id;
  if (
    !answers ||
    typeof responseId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(responseId)
  ) {
    return Response.json({ error: "Las respuestas no son válidas." }, { status: 400 });
  }

  const supabaseUrl = getSupabaseRestUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    return Response.json({ error: "El servicio no está configurado." }, { status: 500 });
  }

  try {
    const supabaseResponse = await fetch(supabaseUrl, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
        "Content-Profile": "mcb_encuesta",
        Prefer: "return=minimal",
        "User-Agent": "mcb-survey-server/1.0",
      },
      body: JSON.stringify({
        id: responseId,
        submitted_at: new Date().toISOString(),
        ...answers,
        visual_style_rating: Number(answers.visual_style_rating),
        survey_version: "v2",
      }),
      cache: "no-store",
    });

    if (!supabaseResponse.ok) {
      const details = await supabaseResponse.text();
      console.error(`Supabase rechazó la respuesta (${supabaseResponse.status}): ${details}`);
      return Response.json({ error: "No se pudo guardar la respuesta." }, { status: 502 });
    }
  } catch (error) {
    console.error("No se pudo conectar con Supabase:", error);
    return Response.json({ error: "No se pudo guardar la respuesta." }, { status: 502 });
  }

  return Response.json({ success: true }, { status: 201 });
}

