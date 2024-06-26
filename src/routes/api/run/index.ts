import { FastifyPluginAsync } from "fastify";
import { createProdia } from "prodia";
import { Langfuse } from "langfuse";

const prodia = createProdia({
  apiKey: process.env.PRODIA_API_KEY!,
});

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
});

const trace = langfuse.trace({
  name: "text-2-image",
  userId: "text-2-image-service",
  // metadata: { user: "user@langfuse.com" },
  // tags: ["production"],
});

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.post<{
    Body: {
      prompt: string;
    };
  }>(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["prompt"],
          properties: {
            prompt: {
              type: "string",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              imageUrl: { type: "string" },
              status: { type: "string" },
              job: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async function (request, reply) {
      const { prompt } = request.body;

      if (!prompt) {
        return reply.code(400).send({
          error: "Prompt is required",
        });
      }

      const span = trace.span({
        name: "generate-image",
        input: { prompt },
      });

      const j = await prodia.generate({ prompt });
      const { imageUrl, status, job } = await prodia.wait(j);

      span.end({
        output: { imageUrl, status, job },
      });

      return { imageUrl, status, job };
    }
  );
};

export default example;
