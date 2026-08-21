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
import { cn } from "@/lib/utils";

export type ExerciseCategory = "relaksasi" | "fokus" | "gerakan";

export interface ExerciseCardProps {
  slug: string;
  name: string;
  category: ExerciseCategory;
  duration: string;
  description?: string;
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
  className,
}: ExerciseCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant="secondary">{categoryLabel[category]}</Badge>
        </div>
        <CardDescription className="font-medium">{duration}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {description ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        ) : null}
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
