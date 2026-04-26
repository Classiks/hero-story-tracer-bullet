import { generateImage } from '#/modules/ai/generate-image';
import { isMockMode, readMockImage } from '#/modules/ai/mock-mode';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/generate/image')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { message } = await request.json();

        if (isMockMode()) {
          return Response.json({ image: await readMockImage() })
        }

        const image = await generateImage(message)

        return Response.json({ image: image.b64Json })
      }
    }
  },
})
