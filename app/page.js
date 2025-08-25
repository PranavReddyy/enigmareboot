"use client";

import { useState, useEffect } from "react";
import { useTeam } from "@/contexts/TeamContext";
import LoginForm from "@/components/LoginForm";
import TeamFormation from "@/components/TeamFormation";
import CommitteeSelection from "@/components/CommitteeSelection";
import GameDashboard from "@/components/GameDashboard";
import Leaderboard from "@/components/Leaderboard";
import MergedTeamInfo from "@/components/MergedTeamInfo";
import BinaryBackground from "@/components/BinaryBackground";

export default function Home() {
  const { team, setTeam } = useTeam();
  const [currentView, setCurrentView] = useState("game");
  const [showRegistration, setShowRegistration] = useState(false);

  // Determine which component to show based on team state
  const getMainComponent = () => {
    if (!team) {
      if (showRegistration) {
        return (
          <TeamFormation
            onComplete={(teamData) => {
              setTeam(teamData);
              setShowRegistration(false);
            }}
          />
        );
      }
      return <LoginForm onRegister={() => setShowRegistration(true)} />;
    }

    // Check if team was merged into another team
    if (team.mergedInto) {
      return <MergedTeamInfo team={team} />;
    }

    // If team exists but no committee assigned, show committee selection
    if (!team.assignedCommittee) {
      return (
        <CommitteeSelection
          team={team}
          onComplete={(updatedTeam) => setTeam(updatedTeam)}
        />
      );
    }

    // If team doesn't have game access, show waiting screen
    if (!team.gameAccessEnabled) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <BinaryBackground />
          <div className="border border-black p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">ENGIMA REBOOT</h2>
            <p className="mb-4">Game is gonna start soon.</p>
            <div className="p-4 border border-gray-300 bg-gray-50 text-left">
              <div className="font-bold">Team: {team.teamName}</div>
              <div>Committee: {team.assignedCommittee}</div>
              <div className="text-sm text-gray-600 mt-2">
                {team.members?.length} member
                {team.members?.length !== 1 ? "s" : ""}
              </div>
              {team.isMatchmade && (
                <div className="text-sm text-purple-600 mt-1 font-bold">
                  ✓ Matched Team
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Show main game interface
    return (
      <div className="min-h-screen bg-white text-black pb-20">
        <BinaryBackground />
        <header className="border-b border-black p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img
                src="/logo_dark.png"
                alt="Reboot Logo"
                className="h-8 w-8 object-contain"
              />
              <h1 className="text-2xl font-bold font-mono">REBOOT</h1>
            </div>
            {/* <div className="flex gap-4">
              <button
                onClick={() => setCurrentView("game")}
                className={`px-4 py-2 border border-black ${
                  currentView === "game"
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
              >
                GAME
              </button>
              <button
                onClick={() => setCurrentView("leaderboard")}
                className={`px-4 py-2 border border-black ${
                  currentView === "leaderboard"
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
              >
                LEADERBOARD
              </button>
            </div> */}
            <div className="text-right">
              <div className="font-mono font-bold">{team.teamName}</div>
              {team.isMatchmade && (
                <div className="text-xs text-purple-600 font-bold">
                  MATCHED TEAM
                </div>
              )}
              <div className="text-sm">Score: {team.score || 0}</div>
              <div className="text-xs">{team.assignedCommittee}</div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4">
          {currentView === "game" ? <GameDashboard /> : <Leaderboard />}
        </main>
      </div>
    );
  };

  return getMainComponent();
}
