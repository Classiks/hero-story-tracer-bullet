import { Button } from '#/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip';
import { createFileRoute } from '@tanstack/react-router'
import { CircleQuestionMark, Loader2 } from "lucide-react";

export const Route = createFileRoute('/story-flow/(loop)/quest')({
  component: RouteComponent,
})

function RouteComponent() {
  const quest = useGetQuest()
  const task = useGetTask()



  return <div>
    <h1>Your Quest: {quest.quest}</h1>
    <p>{quest.content}</p>
    <p>{quest.task}</p>

    <div className="flex flex-row">
      <Button>Accept</Button>
      <Tooltip>
        <TooltipTrigger>
          <Button variant="outline"><Loader2 /></Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Generate a new Quest</p>
        </TooltipContent>
      </Tooltip>
    </div>

    <Dialog>
      <DialogTrigger>
        <Tooltip>
          <TooltipTrigger>
            <CircleQuestionMark />
          </TooltipTrigger>
          <TooltipContent>
            <p>Why this quest</p>
          </TooltipContent>
        </Tooltip>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Why this question</DialogTitle>
          <DialogDescription>
            <p>Recommended Step: {task.task}</p>
            <p>Why: {task.reasoning}</p>
            <p>What is being translated: {quest.metaphors.map((metaphor) => <p>
              {metaphor.real}: {metaphor.metaphor}
            </p>)}</p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
    <Button variant="outline">
    </Button>
  </div >
}

function useGetTask() {
  return {
    task: "this is your task",
    reasoning: "well because..."
  }
}

function useGetQuest() {
  return {
    quest: "Quest Name",
    content: "Quest",
    task: "Task",
    metaphors: [
      {
        real: "thing",
        metaphor: "metaphor"
      }
    ]
  }
}
