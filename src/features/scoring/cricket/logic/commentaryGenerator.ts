// src/features/scoring/cricket/logic/commentaryGenerator.ts

import { ExtraType, WicketType, } from '../types';

interface CommentaryGeneratorParams {
    runs: number;
    isWicket: boolean;
    extraType?: ExtraType;
    wicketType?: WicketType;
    
}

export function generateCommentary({
    runs,
    isWicket,
    extraType,
    wicketType,
    
}: CommentaryGeneratorParams): string {
    if (isWicket) {
        const dismissalType = wicketType?.toLowerCase().replace(/_/g, ' ') || 'run out';
        return `WICKET! ${dismissalType}.`;
    }

    if (extraType === 'wide') {
        const wideRuns = runs + 1;
        if (runs === 0) {
            return `wide ball.`;
        }
        return `wide +${runs} run${runs > 1 ? 's' : ''}. Total ${wideRuns} extra${wideRuns > 1 ? 's' : ''}.`;
    }

    if (extraType === 'no_ball') {
        const noBallRuns = runs + 1;
        if (runs === 0) {
            return `no ball.`;
        }
        return `no ball +${runs} run${runs > 1 ? 's' : ''}. Total ${noBallRuns} extra${noBallRuns > 1 ? 's' : ''}.`;
    }
    
    // Add specific conditions for byes and leg-byes
    if (extraType === 'bye') {
        return `${runs} bye${runs > 1 ? 's' : ''}.`;
    }

    if (extraType === 'leg_bye') {
        return `${runs} leg bye${runs > 1 ? 's' : ''}.`;
    }

    // Handle runs from the bat (no extras)
    if (runs === 0) {
        return `no run.`;
    }

    if (runs === 4) {
        return `FOUR`;
    }

    if (runs === 6) {
        return `SIX`;
    }

    return `${runs} run${runs > 1 ? 's' : ''}.`;
}