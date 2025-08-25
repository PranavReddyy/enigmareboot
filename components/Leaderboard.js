"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Leaderboard() {
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

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center mb-6">LIVE LEADERBOARD</h2>

      <div className="border border-black">
        <div className="grid grid-cols-5 gap-4 p-4 border-b border-black bg-gray-100 font-bold">
          <div>RANK</div>
          <div>TEAM NAME</div>
          <div>SCORE</div>
          <div>PROGRESS</div>
          <div>STATUS</div>
        </div>

        {teams.map((team, index) => (
          <div
            key={team.id}
            className={`grid grid-cols-5 gap-4 p-4 border-b border-gray-200 ${
              index < 3 ? "bg-yellow-50" : ""
            } ${team.isMatchmade ? "bg-purple-25" : ""}`}
          >
            <div className="font-bold text-lg">#{index + 1}</div>

            <div>
              <div className="font-mono font-bold">{team.teamName}</div>
              {team.isMatchmade && (
                <div className="text-xs text-purple-600">
                  Combined Team ({team.members?.length || 0} members)
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
                <span className="bg-yellow-200 px-2 py-1 rounded text-yellow-800 font-bold">
                  FINALE
                </span>
              ) : team.gameAccessEnabled ? (
                <span className="bg-green-200 px-2 py-1 rounded text-green-800">
                  ACTIVE
                </span>
              ) : (
                <span className="bg-gray-200 px-2 py-1 rounded text-gray-600">
                  WAITING
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No active teams yet
        </div>
      )}

      <div className="text-center text-sm text-gray-500 mt-4">
        Showing {teams.length} active teams
        {teams.filter((t) => t.isMatchmade).length > 0 &&
          ` (${teams.filter((t) => t.isMatchmade).length} combined teams)`}
      </div>
    </div>
  );
}
