"use client";

import { useState, useTransition } from "react";
import { addComment } from "@/actions/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { Send } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: { name: string; role: string };
}

export function CommentSection({
  ticketId,
  comments,
}: {
  ticketId: string;
  comments: Comment[];
}) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    startTransition(async () => {
      await addComment(ticketId, content);
      setContent("");
    });
  }

  return (
    <div className="space-y-4">
      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{comment.author.name}</span>
                <Badge variant="outline" className="text-xs py-0">
                  {ROLE_LABELS[comment.author.role]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {timeAgo(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isPending || !content.trim()}
          className="shrink-0 self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
