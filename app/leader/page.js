"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function LeaderboardPage() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, "teams"),
        orderBy("score", "desc"),
        orderBy("lastSubmissionTimestamp", "asc")
      ),
      (snapshot) => {
        const teamsData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((team) => !team.mergedInto); // Only show teams that haven't been merged

        setTeams(teamsData);
      }
    );

    return unsubscribe;
  }, []);

  const getProgressText = (team) => {
    if (team.currentCommittee === "COMPLETED") return "COMPLETED";

    const committeeNames = {
      AIML: "AI/ML",
      SysCom: "SysCom",
      CyberSec: "CyberSec",
      GameDev: "GameDev",
      WebDev: "WebDev",
    };

    const committeeName =
      committeeNames[team.currentCommittee] || team.currentCommittee;

    if (team.currentLevel) {
      const level = team.currentLevel === "level1" ? "L1" : "L2";
      return `${committeeName} ${level}`;
    }

    return committeeName;
  };

  const getPositionStyling = (index) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-200 to-yellow-300 border-yellow-400"; // 1st place - Gold
      case 1:
        return "bg-gradient-to-r from-gray-200 to-gray-300 border-gray-400"; // 2nd place - Silver
      case 2:
        return "bg-gradient-to-r from-orange-200 to-orange-300 border-orange-400"; // 3rd place - Bronze
      default:
        return "bg-white";
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img
              src="/logo_dark.png"
              alt="Reboot Logo"
              className="h-8 w-8 object-contain"
            />
            <h1 className="text-2xl font-bold font-mono">REBOOT LEADERBOARD</h1>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-black text-white border border-black hover:bg-gray-800 transition-colors font-bold"
          >
            BACK TO GAME
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold font-mono mb-4">LIVE RANKINGS</h2>
          <p className="text-gray-600">
            Real-time competition standings • Updated automatically
          </p>
        </div>

        {/* Top 3 Podium */}
        {teams.length >= 3 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold font-mono text-center mb-6">
              TOP 3
            </h3>
            <div className="flex justify-center items-end space-x-4 mb-8">
              {/* 2nd Place */}
              <div className="text-center">
                <div className="bg-gradient-to-r from-gray-200 to-gray-300 border-2 border-gray-400 p-6 rounded-lg mb-2 h-32 flex flex-col justify-center">
                  <div className="text-3xl font-bold font-mono text-gray-700">
                    2
                  </div>
                  <div className="text-sm font-bold">
                    {teams[1]?.score || 0} pts
                  </div>
                </div>
                <div className="font-mono font-bold text-lg">
                  {teams[1]?.teamName}
                </div>
                <div className="text-sm text-gray-600">
                  {getProgressText(teams[1])}
                </div>
              </div>

              {/* 1st Place */}
              <div className="text-center">
                <div className="bg-gradient-to-r from-yellow-200 to-yellow-300 border-2 border-yellow-400 p-6 rounded-lg mb-2 h-40 flex flex-col justify-center">
                  <div className="text-4xl font-bold font-mono text-yellow-700">
                    1
                  </div>
                  <div className="text-sm font-bold">
                    {teams[0]?.score || 0} pts
                  </div>
                </div>
                <div className="font-mono font-bold text-xl">
                  {teams[0]?.teamName}
                </div>
                <div className="text-sm text-gray-600">
                  {getProgressText(teams[0])}
                </div>
              </div>

              {/* 3rd Place */}
              <div className="text-center">
                <div className="bg-gradient-to-r from-orange-200 to-orange-300 border-2 border-orange-400 p-6 rounded-lg mb-2 h-28 flex flex-col justify-center">
                  <div className="text-2xl font-bold font-mono text-orange-700">
                    3
                  </div>
                  <div className="text-sm font-bold">
                    {teams[2]?.score || 0} pts
                  </div>
                </div>
                <div className="font-mono font-bold text-lg">
                  {teams[2]?.teamName}
                </div>
                <div className="text-sm text-gray-600">
                  {getProgressText(teams[2])}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="border-2 border-black">
          <div className="bg-black text-white p-4">
            <h3 className="text-xl font-bold font-mono text-center">
              FULL STANDINGS
            </h3>
          </div>

          <div className="grid grid-cols-6 gap-4 p-4 border-b border-black bg-gray-100 font-bold">
            <div>RANK</div>
            <div>TEAM NAME</div>
            <div>SCORE</div>
            <div>PROGRESS</div>
            <div>STATUS</div>
            <div>MEMBERS</div>
          </div>

          {teams.map((team, index) => (
            <div
              key={team.id}
              className={`grid grid-cols-6 gap-4 p-4 border-b border-gray-200 ${getPositionStyling(
                index
              )} ${team.isMatchmade ? "border-l-4 border-l-purple-500" : ""}`}
            >
              <div className="font-bold text-lg flex items-center">
                <span className={`${index < 3 ? "text-2xl" : ""}`}>
                  #{index + 1}
                </span>
                {index === 0 && (
                  <span className="ml-2 text-yellow-600">👑</span>
                )}
              </div>

              <div>
                <div className="font-mono font-bold">{team.teamName}</div>
                {team.isMatchmade && (
                  <div className="text-xs text-purple-600 font-bold">
                    COMBINED TEAM
                  </div>
                )}
              </div>

              <div className="font-bold text-lg">{team.score || 0}</div>

              <div>
                <div className="font-medium">{getProgressText(team)}</div>
                <div className="text-xs text-gray-500">
                  {team.assignedCommittee && `SCAB: ${team.assignedCommittee}`}
                </div>
              </div>

              <div className="text-sm">
                {team.goldenKnifeAccess ? (
                  <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-2 py-1 text-yellow-900 font-bold border border-yellow-600">
                    FINALE
                  </span>
                ) : team.gameAccessEnabled ? (
                  <span className="bg-green-100 px-2 py-1 text-green-800 border border-green-300">
                    ACTIVE
                  </span>
                ) : (
                  <span className="bg-gray-100 px-2 py-1 text-gray-600 border border-gray-300">
                    WAITING
                  </span>
                )}
              </div>

              <div className="text-sm">
                <span className="font-bold">{team.members?.length || 0}</span>
                <span className="text-gray-500">/5</span>
              </div>
            </div>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="text-center text-gray-500 py-12 border-2 border-black">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">No Teams Yet</h3>
            <p>Teams will appear here once they start competing</p>
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-black p-4 text-center">
            <div className="text-2xl font-bold">{teams.length}</div>
            <div className="text-sm text-gray-600">Active Teams</div>
          </div>
          <div className="border border-black p-4 text-center">
            <div className="text-2xl font-bold">
              {teams.filter((t) => t.isMatchmade).length}
            </div>
            <div className="text-sm text-gray-600">Combined Teams</div>
          </div>
          <div className="border border-black p-4 text-center">
            <div className="text-2xl font-bold">
              {teams.filter((t) => t.goldenKnifeAccess).length}
            </div>
            <div className="text-sm text-gray-600">Finale Qualified</div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center mt-6 text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
          <br />
          <span className="text-xs">
            Refreshes automatically every few seconds
          </span>
        </div>
      </main>
    </div>
  );
}
