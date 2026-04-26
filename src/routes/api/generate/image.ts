import { generateImage } from '#/modules/ai/generate-image';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/generate/image')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { message } = await request.json();

        const image = await generateImage(message)

        return Response.json({ image: image.b64Json })
      }
    }
  },
})
