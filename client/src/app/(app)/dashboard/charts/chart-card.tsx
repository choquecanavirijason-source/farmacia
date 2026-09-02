"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, Maximize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ChartCardProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  height?: number;
  expandedHeight?: number;
  children: (height: number) => ReactNode;
}

export function ChartCard({
  title,
  description,
  isLoading,
  isEmpty,
  emptyMessage = "Sin datos suficientes para este gráfico todavía.",
  className,
  height = 300,
  expandedHeight,
  children,
}: ChartCardProps) {
  const [expanded, setExpanded] = useState(false);
  const bigHeight = expandedHeight ?? Math.max(Math.round(height * 1.7), 420);
  const canExpand = !isLoading && !isEmpty;

  return (
    <>
      <Card className={`border-border/60 ${className ?? ""}`}>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
          {canExpand && (
            <CardAction>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded(true)}
                title="Ampliar gráfico"
              >
                <Maximize2 className="size-3.5" />
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="-mt-3">
          {isLoading ? (
            <Skeleton style={{ height }} className="w-full" />
          ) : isEmpty ? (
            <div
              className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground"
              style={{ height }}
            >
              <BarChart3 className="size-6 opacity-50" aria-hidden />
              <p className="text-xs">{emptyMessage}</p>
            </div>
          ) : (
            children(height)
          )}
        </CardContent>
      </Card>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="pt-2">{expanded && children(bigHeight)}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
