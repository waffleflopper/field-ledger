"use client";

import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/trpc/react";

function getFeedbackPageUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

export function FeedbackDialog({
  triggerClassName,
  triggerLabel = "Feedback",
}: {
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [filedIssueUrl, setFiledIssueUrl] = useState<string | null>(null);
  const submitFeedback = trpc.feedback.submit.useMutation({
    onSuccess(issue) {
      setFiledIssueUrl(issue.url);
      setMessage("");
    },
  });
  const trimmedMessage = message.trim();
  const canSubmit = trimmedMessage.length > 0 && !submitFeedback.isPending;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      submitFeedback.reset();
      setFiledIssueUrl(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    submitFeedback.mutate({
      message: trimmedMessage,
      pageUrl: getFeedbackPageUrl(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className={triggerClassName}
          size="sm"
          type="button"
          variant="ghost"
        >
          <MessageSquare aria-hidden="true" className="size-4" />
          <span>{triggerLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Send feedback</DialogTitle>
            <DialogDescription>
              Tell us what happened, what you expected, or what would make this
              easier.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="feedback-message">Feedback</Label>
            <Textarea
              autoFocus
              className="min-h-36 resize-y rounded-md bg-background"
              id="feedback-message"
              maxLength={5000}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write the bug report, idea, or rough note here."
              value={message}
            />
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                Filed as a GitHub issue with needs-triage and feedback labels.
              </span>
              <span className="font-mono">{message.length}/5000</span>
            </div>
          </div>
          {submitFeedback.error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitFeedback.error.message}
            </p>
          ) : null}
          {filedIssueUrl ? (
            <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              Feedback filed.{" "}
              <a
                className="font-medium text-primary underline-offset-4 hover:underline"
                href={filedIssueUrl}
                rel="noreferrer"
                target="_blank"
              >
                View issue
              </a>
            </p>
          ) : null}
          <DialogFooter>
            <Button disabled={!canSubmit} type="submit">
              <Send aria-hidden="true" className="size-4" />
              {submitFeedback.isPending ? "Sending" : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
