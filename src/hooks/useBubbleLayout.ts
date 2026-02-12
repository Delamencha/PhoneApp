import { useMemo } from 'react';
import { Idea, BubbleData } from '../models/types';
import {
  BubbleInput,
  CanvasSize,
  computeLayout,
  getBubbleColor,
  getElapsedLabel,
  baseRadius,
  computeScaleFactor,
} from '../layout/bubblePacker';

/**
 * Hook that computes bubble visual data from ideas + canvas dimensions.
 */
export function useBubbleLayout(
  ideas: Idea[],
  canvasSize: CanvasSize
): BubbleData[] {
  return useMemo(() => {
    if (ideas.length === 0 || canvasSize.width === 0 || canvasSize.height === 0) {
      return [];
    }

    const inputs: BubbleInput[] = ideas.map((idea) => ({
      id: idea.id,
      willingness: idea.willingness,
      posX: idea.posX,
      posY: idea.posY,
    }));

    const outputs = computeLayout(inputs, canvasSize);

    return outputs.map((out) => {
      const idea = ideas.find((i) => i.id === out.id)!;
      return {
        idea,
        radius: out.radius,
        screenX: out.screenX,
        screenY: out.screenY,
        color: getBubbleColor(idea.createdAt),
        elapsedLabel: getElapsedLabel(idea.createdAt),
      };
    });
  }, [ideas, canvasSize]);
}

/**
 * Utility: compute what scale factor and radius a new bubble would get
 * if added to current ideas list.
 */
export function previewNewBubbleRadius(
  existingIdeas: Idea[],
  newWillingness: number,
  canvasSize: CanvasSize
): number {
  const inputs: BubbleInput[] = [
    ...existingIdeas.map((idea) => ({
      id: idea.id,
      willingness: idea.willingness,
      posX: idea.posX,
      posY: idea.posY,
    })),
    { id: -1, willingness: newWillingness, posX: 0.5, posY: 0.5 },
  ];

  const scale = computeScaleFactor(inputs, canvasSize);
  return baseRadius(newWillingness) * scale;
}
