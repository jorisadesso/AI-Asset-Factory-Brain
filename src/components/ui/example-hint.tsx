import { Lightbulb } from "lucide-react";

interface ExampleHintProps {
  examples: string[];
}

export function ExampleHint({ examples }: ExampleHintProps) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
      <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
      <div className="text-xs text-amber-700 space-y-0.5">
        <span className="font-medium">Beispiele:</span>
        {examples.map((ex, i) => (
          <p key={i} className="italic">{ex}</p>
        ))}
      </div>
    </div>
  );
}
