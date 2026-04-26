import { generateData } from '#/modules/ai/generate-data';
import { getSchema } from '#/modules/ai/schemas/get-schema';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/generate/data')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { message, schemaId } = await request.json();

        const schema = getSchema(schemaId);
        const data = await generateData(message, schema)

        return Response.json(data)
      }
    }
  },
})

