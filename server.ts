import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/translate", async (req, res) => {
    try {
      const { sourceLang, targetLang, zones, items } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Missing Gemini API Key in environment variables." });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a professional translator for an architecture and interior design company.
        Translate the following quotation data from ${sourceLang} to ${targetLang}.
        
        RULES:
        1. ZONES follow the pattern "LEVEL > AREA" or "SITE > LEVEL > AREA" (e.g., "CASA 1 > Piso 1 > Cocina"). Translate ALL parts (e.g., "HOUSE 1 > Floor 1 > Kitchen").
        2. ITEMS have 'description' and 'zone'. You MUST translate both.
        3. The 'zone' in ITEMS must EXACTLY match one of the translated strings in the ZONES array.
        4. Maintain all IDs exactly as provided.
        5. Return valid JSON.
        
        DATA TO TRANSLATE:
        ZONES: ${JSON.stringify(zones)}
        ITEMS: ${JSON.stringify(items)}`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              zones: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of unique zones translated in 'LEVEL > AREA' format"
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    description: { type: Type.STRING, description: "Translated product description" },
                    zone: { type: Type.STRING, description: "Translated zone name (must match one in zones array)" }
                  },
                  required: ["id", "description", "zone"]
                },
                description: "List of items with translated descriptions and zones"
              }
            },
            required: ["zones", "items"]
          }
        }
      });

      const text = result.text;
      if (!text) {
        return res.status(500).json({ error: "No text returned from Gemini" });
      }

      const translated = JSON.parse(text);
      res.json(translated);
    } catch (error: any) {
      console.error("Translation API error:", error);
      res.status(500).json({ error: error.message || "Failed to translate content" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
