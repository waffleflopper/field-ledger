import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { submitFeedback } from "@/modules/feedback";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/init";

const submitFeedbackInput = z.object({
  message: z.string().trim().min(1, "Feedback message is required.").max(5000),
  pageUrl: z.url().optional(),
});

function toTRPCError(
  error: unknown,
  context: { accountId: string; operation: string; userId: string },
): never {
  const message =
    error instanceof Error ? error.message : "Unable to send feedback.";

  switch (message) {
    case "Feedback message is required.":
    case "Feedback message must be 5,000 characters or fewer.":
      throw new TRPCError({ code: "BAD_REQUEST", message });
    case "A GitHub issue provider is required.":
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Feedback is not configured.",
      });
    default:
      console.error("Unexpected feedback tRPC error.", {
        accountId: context.accountId,
        operation: context.operation,
        userId: context.userId,
        error,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to send feedback.",
      });
  }
}

export const feedbackRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(submitFeedbackInput)
    .mutation(async ({ ctx, input }) => {
      try {
        return await submitFeedback({
          feedbackPort: ctx.githubIssuesPort,
          input: {
            message: input.message,
            ...(input.pageUrl ? { pageUrl: input.pageUrl } : {}),
          },
        });
      } catch (error) {
        toTRPCError(error, {
          accountId: ctx.account.id,
          operation: "feedback.submit",
          userId: ctx.session.userId,
        });
      }
    }),
});
