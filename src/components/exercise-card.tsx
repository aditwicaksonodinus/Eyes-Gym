import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type ExerciseCategory = "relaksasi" | "fokus" | "gerakan";

export interface ExerciseCardProps {
  slug: string;
  name: string;
  category: ExerciseCategory;
  duration: string;
  description?: string;
  /** Completion progress 0-100. */
  progress?: number;
  className?: string;
}

const categoryLabel: Record<ExerciseCategory, string> = {
  relaksasi: "Relaksasi",
  fokus: "Fokus",
  gerakan: "Gerakan",
};

export function ExerciseCard({
  slug,
  name,
  category,
  duration,
  description,
  progress = 0,
  className,
}: ExerciseCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant="secondary">{categoryLabel[category]}</Badge>
        </div>
        <CardDescription>{duration}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-4 space-y-1.5">
          <Progress value={progress} aria-label={`Progres ${name}`} />
          <p className="text-xs text-muted-foreground">{progress}% selesai</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/exercises/${slug}`}>Mulai</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ExerciseCard;
