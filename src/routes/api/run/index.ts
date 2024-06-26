import { FastifyPluginAsync } from "fastify";
import { createProdia } from "prodia";

const prodia = createProdia({
  apiKey: process.env.PRODIA_API_KEY!,
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

      const j = await prodia.generate({ prompt });
      const { imageUrl, status, job } = await prodia.wait(j);
      return { imageUrl, status, job };
    }
  );
};

export default example;
