const Anthropic = require('@anthropic-ai/sdk').default;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function generateTaskBreakdown(nombre, descripcion, tipo) {
  const systemPrompt = `Eres un project manager experto en agencias de diseño web y desarrollo digital.
Tu trabajo es desglosar proyectos en tareas concretas y accionables.

Fases tipicas de un proyecto:
- Diseno: wireframes, mockups, identidad visual
- Desarrollo: frontend, backend, integraciones
- Contenido: textos, imagenes, SEO
- Testing: pruebas, QA, correcciones
- Entrega: deploy, formacion, documentacion

Reglas:
- Genera entre 5 y 15 tareas dependiendo de la complejidad
- Cada tarea debe tener un titulo claro y conciso
- Las horas deben ser realistas para un freelance/autonomo
- Agrupa las tareas por fase (grupo)
- Responde SOLO con un JSON array, sin markdown ni explicaciones

Formato de cada tarea:
{"titulo": "string", "descripcion": "string breve", "horas": number, "grupo": "nombre de fase"}`;

  const userMessage = `Proyecto: ${nombre}
Tipo: ${tipo === 'horas' ? 'Bolsa de horas' : 'Proyecto cerrado'}
${descripcion ? `Descripcion: ${descripcion}` : 'Sin descripcion adicional'}

Genera el desglose de tareas en formato JSON array.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }]
  });

  const text = response.content[0].text;

  // Parse JSON, handling possible markdown wrapping
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  return JSON.parse(jsonStr);
}

async function chatWithData(message, history, contextData) {
  const systemPrompt = `Eres un asistente de gestion para un autonomo espanol que gestiona una agencia de diseno web y desarrollo digital.

Datos actuales del negocio:
${JSON.stringify(contextData, null, 2)}

CAPACIDADES DE ACCION:
Puedes EJECUTAR acciones en el sistema. Cuando el usuario te pida crear, modificar o gestionar datos, debes responder con un JSON especial.

Acciones disponibles:
1. create_proyecto - Crear un proyecto nuevo
   Datos: { "cliente_id": "id del cliente", "nombre": "nombre", "descripcion": "desc", "tipo": "proyecto" o "horas", "presupuesto": 0, "precio_hora": 0, "horas_estimadas": 0 }

2. create_tarea - Crear una tarea en un proyecto
   Datos: { "proyecto_id": "USE_LAST_PROJECT" o "id real", "titulo": "titulo", "descripcion": "desc", "horas": 0, "grupo": "nombre de fase" }

3. create_gasto - Crear un gasto
   Datos: { "descripcion": "desc", "importe": 0, "fecha": "YYYY-MM-DD", "categoria": "software|hosting|subcontratacion|dietas|material|transporte|telefonia|formacion|otros", "proveedor": "", "iva_soportado": 21, "deducible": 1 }

4. create_recordatorio - Crear un recordatorio personal
   Datos: { "titulo": "titulo", "descripcion": "desc", "cuadrante": "hacer_ahora|programar|rapido|algun_dia", "fecha_vencimiento": "YYYY-MM-DD" o null, "categoria": "negocio|fiscal|cliente|personal", "recurrente": "ninguna|diario|semanal|mensual" }

FORMATO DE RESPUESTA:
- Si el usuario pide EJECUTAR una accion (crear, añadir, registrar, etc.), responde SOLO con un JSON asi:
{"type":"actions","actions":[{"action":"create_proyecto","data":{...}},{"action":"create_tarea","data":{...}}],"message":"He creado el proyecto X con Y tareas."}

- Si el usuario hace una CONSULTA (cuanto, cuantos, cual, que, etc.), responde SOLO con un JSON asi:
{"type":"text","message":"La respuesta aqui..."}

REGLAS CRITICAS:
- Responde SIEMPRE con JSON valido, sin markdown, sin backticks, sin texto adicional fuera del JSON
- Para crear tareas en un proyecto recien creado, usa "USE_LAST_PROJECT" como proyecto_id
- Para asignar un cliente, busca en la lista de clientes_con_id por nombre/empresa (busqueda flexible, no exacta)
- Si el usuario menciona un cliente que no encuentras, indicalo en el message y no crees el proyecto
- Cuando crees un proyecto con tareas, incluye primero la accion create_proyecto y luego las create_tarea
- La fecha por defecto para tareas es hoy: ${new Date().toISOString().split('T')[0]}
- Responde siempre en espanol
- Formatea importes en euros con 2 decimales
- No inventes datos que no esten en el contexto`;

  const messages = [];

  if (history && history.length > 0) {
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: 'user', content: message });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 3000,
    system: systemPrompt,
    messages
  });

  const text = response.content[0].text;

  // Try to parse as JSON
  try {
    let jsonStr = text.trim();
    // Handle possible markdown wrapping
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    return JSON.parse(jsonStr);
  } catch {
    // If not valid JSON, return as plain text
    return { type: 'text', message: text };
  }
}

async function extractInvoiceData(fileBuffer, mimeType) {
  const systemPrompt = `Eres un experto en leer facturas y tickets de compra españoles.
Extrae los datos del documento adjunto y devuelve SOLO un JSON con esta estructura exacta:

{
  "descripcion": "descripcion breve del gasto/servicio",
  "importe": numero total con IVA (ejemplo: 121.00),
  "fecha": "YYYY-MM-DD",
  "proveedor": "nombre del proveedor o empresa emisora",
  "numero_factura": "numero de factura si existe",
  "iva_soportado": porcentaje de IVA detectado (ejemplo: 21),
  "categoria": una de estas opciones: "hosting", "software", "subcontratacion", "dietas", "material", "transporte", "telefonia", "formacion", "otros",
  "notas": "cualquier dato adicional relevante"
}

Reglas:
- Si no puedes leer un campo, dejalo como null
- El importe debe ser el TOTAL con IVA incluido
- La fecha debe estar en formato YYYY-MM-DD
- Detecta el tipo de IVA (21%, 10%, 4%, 0%)
- Clasifica la categoria segun el tipo de gasto
- Responde SOLO con el JSON, sin markdown ni explicaciones`;

  const base64Data = fileBuffer.toString('base64');

  // Determine content type for the API
  const isPDF = mimeType === 'application/pdf';

  const content = [
    {
      type: isPDF ? 'document' : 'image',
      source: {
        type: 'base64',
        media_type: mimeType,
        data: base64Data
      }
    },
    {
      type: 'text',
      text: 'Extrae todos los datos de este documento/ticket. Devuelve solo el JSON.'
    }
  ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content }]
  });

  const text = response.content[0].text;

  // Parse JSON, handling possible markdown wrapping
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  return JSON.parse(jsonStr);
}

async function generateBriefing(contextData) {
  const systemPrompt = `Eres el asistente personal de un autonomo espanol que gestiona una agencia de diseno web.
Tu tarea es generar un briefing matutino breve y accionable en espanol.

Datos del dia:
${JSON.stringify(contextData, null, 2)}

Reglas:
- Maximo 4-5 frases
- Empieza con un saludo segun la hora del dia
- Menciona los items vencidos primero (urgencia)
- Menciona los items de hoy
- Si hay alertas fiscales proximas, mencionarlas
- Si hay plazos de proyectos proximos, mencionarlos
- Tono: profesional pero cercano, como un asistente de confianza
- Usa numeros concretos, no generalices
- Termina con una sugerencia de prioridad
- Responde SOLO texto plano, sin JSON, sin markdown`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'Genera mi briefing del dia.' }]
  });

  return response.content[0].text;
}

async function parseEmailToTasks(emailContent, fromEmail, fromName, clientesList, proyectosList) {
  const systemPrompt = `Eres un project manager experto en una agencia de diseno web y desarrollo digital.
Tu tarea es analizar un email de un cliente y extraer tareas accionables.

Lista de clientes existentes en el sistema:
${JSON.stringify(clientesList.map(c => ({ id: c.id, nombre: c.nombre, email: c.email, empresa: c.empresa })), null, 2)}

Lista de proyectos activos:
${JSON.stringify(proyectosList.map(p => ({ id: p.id, nombre: p.nombre, cliente_nombre: p.cliente_nombre, estado: p.estado })), null, 2)}

Reglas:
- Intenta hacer match del remitente con un cliente existente (por email o por nombre/empresa)
- Genera tareas concretas y accionables basadas en lo que pide el email
- Cada tarea debe tener titulo claro, descripcion breve, horas estimadas realistas y grupo/fase
- Si puedes inferir a que proyecto existente van las tareas, sugierelo
- Responde SOLO con un JSON, sin markdown ni explicaciones

Formato de respuesta:
{
  "cliente_match": { "id": "uuid o null", "nombre": "nombre del cliente", "confianza": "alta|media|baja|ninguna" },
  "resumen": "resumen breve del pedido en 1-2 frases",
  "tareas": [
    { "titulo": "string", "descripcion": "string breve", "horas_estimadas": number, "grupo": "nombre de fase" }
  ],
  "proyecto_sugerido": { "id": "uuid o null", "nombre": "nombre o null" }
}`;

  const userMessage = `Email de: ${fromName} <${fromEmail}>
Contenido del email:
${emailContent}

Analiza este email y extrae las tareas.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }]
  });

  const text = response.content[0].text;

  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  return JSON.parse(jsonStr);
}

module.exports = { generateTaskBreakdown, chatWithData, extractInvoiceData, generateBriefing, parseEmailToTasks };
