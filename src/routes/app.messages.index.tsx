import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/app/messages/")({
  component: () => (
    <div className="hidden h-[60vh] flex-col items-center justify-center rounded-3xl glass-strong text-center md:flex">
      <MessageCircle className="mb-3 h-10 w-10 text-[oklch(0.66_0.24_5)]" />
      <p className="font-medium">Choisissez une conversation</p>
      <p className="mt-1 text-sm text-muted-foreground">Vos discussions apparaîtront ici.</p>
    </div>
  ),
});
