// src/features/scoring/cricket/components/CommentaryPanel.tsx
import { Player } from '../types';

interface CommentaryEntry {
  text: string;
  timestamp: string;
  overNumber: number;
  ballInOver: number;
  runs: number;
  isWicket: boolean;
  extraType?: 'wide' | 'no_ball' | 'bye' | 'leg_bye';
}

interface CommentaryPanelProps {
  commentary: CommentaryEntry[];
  players: Player[];
}

export function CommentaryPanel({ commentary, players }: CommentaryPanelProps) {
  const getPlayerName = (id: string) => 
    players.find(p => p.id === id)?.name || 'Unknown';

  return (
    <div className="bg-gray-800 p-4 rounded-lg h-full">
      <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">
        Ball-by-Ball Commentary
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {commentary.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No commentary yet</p>
        ) : (
          commentary.map((entry, index) => (
            <div key={index} className="border-b border-gray-700 pb-3 last:border-0">
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center 
                  ${entry.isWicket ? 'bg-red-600' : 'bg-blue-600'}`}>
                  <span className="text-white text-sm font-bold">
                    {entry.isWicket ? 'W' : entry.runs}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">
                    {entry.overNumber}.{entry.ballInOver}
                  </p>
                  <p className="text-white">{entry.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}