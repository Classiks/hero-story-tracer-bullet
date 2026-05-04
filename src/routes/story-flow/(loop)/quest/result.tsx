import { Button } from '#/components/ui/button';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Route as NextRoute } from "#/routes/story-flow/(loop)/quest/proposal"

type QuestResult = {
  success?: boolean,
  note?: string
}

export const Route = createFileRoute('/story-flow/(loop)/quest/result')({
  component: RouteComponent,
  validateSearch: (search): QuestResult => search
})

function RouteComponent() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();

  const resultingTextQuery = useGetResultingText()
  const imageQuery = useGetImage()

  return <div>
    <p>Success: {`${searchParams.success}`}</p>
    <p>Note: {searchParams.note}</p>

    <div className="my-10" />

    <div>Image {imageQuery.data.image}</div>

    <div>{resultingTextQuery.data.text.split("\n").map(e => <p>{e}</p>)}</div>

    <Button onClick={() => navigate({ to: NextRoute.to })}>Onto the next Quest</Button>
  </div>
}

function useGetResultingText() {
  return {
    data: {
      text: "mytext",
      reasoning: "reasoning"
    }
  }
}


function useGetImage() {
  return {
    data: {
      image: "base64string"
    }
  }
}


