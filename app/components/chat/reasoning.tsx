"useclient"

import {
  Reasoning as ReasoningComponent,
  ReasoningContent,
  ReasoningResponse,
  ReasoningTrigger,
} from "@/components/prompt-kit/reasoning"

type ReasoningProps = {
  reasoning: string
}

export function Reasoning({ reasoning }: ReasoningProps) {
  return (
    <ReasoningComponent>
      <div className="flex w-full flex-col gap-3">
        <ReasoningTrigger>Thinking...</ReasoningTrigger>
        <ReasoningContent className="border-l-border ml-2 border-l-2 px-2 pb-1">
          <ReasoningResponse text={reasoning} />
        </ReasoningContent>
      </div>
    </ReasoningComponent>
  )
}
