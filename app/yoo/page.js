"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  where,
  getDocs,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const ADMIN_PASSWORD = "ankitsreboot";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [currentTab, setCurrentTab] = useState("teams");
  const [teams, setTeams] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const teamsUnsubscribe = onSnapshot(
        query(collection(db, "teams"), orderBy("score", "desc")),
        (snapshot) => {
          const teamsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setTeams(teamsData);
        }
      );

      const committeesUnsubscribe = onSnapshot(
        query(collection(db, "committees"), orderBy("order")),
        (snapshot) => {
          const committeesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCommittees(committeesData);
        }
      );

      return () => {
        teamsUnsubscribe();
        committeesUnsubscribe();
      };
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Invalid password");
    }
  };

  const performMatchmaking = async () => {
    setLoading(true);
    try {
      const incompleteTeams = teams.filter(
        (team) =>
          team.members.length < 5 && team.openToMatchmaking && !team.isMatchmade
      );

      if (incompleteTeams.length < 2) {
        alert(
          "Not enough teams available for matchmaking (need at least 2 incomplete teams)"
        );
        return;
      }

      const matches = [];
      const usedTeamIds = new Set();

      for (let i = 0; i < incompleteTeams.length - 1; i++) {
        if (usedTeamIds.has(incompleteTeams[i].id)) continue;

        for (let j = i + 1; j < incompleteTeams.length; j++) {
          if (usedTeamIds.has(incompleteTeams[j].id)) continue;

          const team1 = incompleteTeams[i];
          const team2 = incompleteTeams[j];
          const combinedSize = team1.members.length + team2.members.length;

          if (combinedSize <= 5) {
            matches.push({ team1, team2 });
            usedTeamIds.add(team1.id);
            usedTeamIds.add(team2.id);
            break;
          }
        }
      }

      if (matches.length === 0) {
        alert("No compatible teams found for matchmaking");
        return;
      }

      const batch = writeBatch(db);

      for (const match of matches) {
        const { team1, team2 } = match;
        const combinedMembers = [...team1.members, ...team2.members];

        // Update team1 (the active/main team) - KEEP ORIGINAL NAME
        batch.update(doc(db, "teams", team1.id), {
          members: combinedMembers,
          // teamName: team1.teamName, // KEEP ORIGINAL NAME - don't change this!
          password: team1.password, // KEEP ORIGINAL PASSWORD
          isMatchmade: true,
          matchedWith: team2.teamName, // Track which team was merged in
          matchedTeams: [team2.teamName], // List of merged team names
          originalMemberCount: team1.members.length,
          mergedMemberCount: team2.members.length,
        });

        // Update team2 (the merged team)
        batch.update(doc(db, "teams", team2.id), {
          isMatchmade: true,
          mergedInto: team1.id,
          mergedIntoTeam: team1.teamName, // Reference to main team's ORIGINAL name
          gameAccessEnabled: false,
        });
      }

      await batch.commit();
      alert(`Successfully matched ${matches.length} pairs of teams!`);
    } catch (error) {
      console.error("Error performing matchmaking:", error);
      alert("Error performing matchmaking");
    } finally {
      setLoading(false);
    }
  };

  const enableGlobalGameAccess = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const q = query(
        collection(db, "teams"),
        where("gameAccessEnabled", "==", false)
      );
      const snapshot = await getDocs(q);

      const teamsToEnable = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return !data.mergedInto;
      });

      teamsToEnable.forEach((doc) => {
        batch.update(doc.ref, { gameAccessEnabled: true });
      });

      await batch.commit();
      alert(`Enabled game access for ${teamsToEnable.length} teams!`);
    } catch (error) {
      console.error("Error enabling global access:", error);
      alert("Error enabling global access");
    } finally {
      setLoading(false);
    }
  };

  const enableFinaleForTopPerCommittee = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const activeTeams = teams.filter((team) => !team.mergedInto);

      // Group teams by their assigned committee
      const teamsByCommittee = {};
      activeTeams.forEach((team) => {
        if (team.assignedCommittee) {
          if (!teamsByCommittee[team.assignedCommittee]) {
            teamsByCommittee[team.assignedCommittee] = [];
          }
          teamsByCommittee[team.assignedCommittee].push(team);
        }
      });

      let totalFinaleTeams = 0;

      // Enable finale for top 1 teams from each committee
      Object.keys(teamsByCommittee).forEach((committeeId) => {
        const committeeTeams = teamsByCommittee[committeeId]
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 1); // Top 1 from each committee

        committeeTeams.forEach((team) => {
          batch.update(doc(db, "teams", team.id), { goldenKnifeAccess: true });
          totalFinaleTeams++;
        });
      });

      await batch.commit();
      alert(
        `Enabled finale access for ${totalFinaleTeams} teams (top team from each committee)!`
      );
    } catch (error) {
      console.error("Error enabling finale:", error);
      alert("Error enabling finale access");
    } finally {
      setLoading(false);
    }
  };

  const verifySubmission = async (teamId, committeeId, levelId = null) => {
    const teamName = teams.find((t) => t.id === teamId)?.teamName;
    const committee = committees.find((c) => c.id === committeeId);
    const levelName = levelId
      ? committee?.levels?.find((l) => l.id === levelId)?.name
      : "";
    const challengeName = levelName
      ? `${committee.name} - ${levelName}`
      : committee.name;

    if (!confirm(`Verify submission for ${teamName} - ${challengeName}?`))
      return;

    setLoading(true);
    try {
      const completionId = levelId ? `${committeeId}_${levelId}` : committeeId;
      const completionQuery = query(
        collection(db, "completions"),
        where("teamId", "==", teamId),
        where("challengeId", "==", completionId)
      );
      const existingCompletion = await getDocs(completionQuery);

      if (!existingCompletion.empty) {
        alert("Team has already completed this challenge!");
        return;
      }

      // Calculate position and points
      const allCompletions = await getDocs(
        query(
          collection(db, "completions"),
          where("challengeId", "==", completionId)
        )
      );
      const position = allCompletions.size + 1;

      let points = Math.max(0, 11 - position);
      if (position > 10) points = 0;

      const team = teams.find((t) => t.id === teamId);
      if (team?.assignedCommittee === committeeId) {
        points += 1; // SCAB bonus
      }

      // Determine next progression
      const currentCommittee = committees.find((c) => c.id === committeeId);
      let nextCommittee = team.currentCommittee;
      let nextLevel = team.currentLevel;

      if (currentCommittee.levels && levelId) {
        // Multi-level committee
        if (levelId === "level1") {
          nextLevel = "level2"; // Progress to level 2 of same committee
        } else if (levelId === "level2") {
          // Progress to next committee
          const nextCommitteeData = committees.find(
            (c) => c.order === currentCommittee.order + 1
          );
          if (nextCommitteeData) {
            nextCommittee = nextCommitteeData.id;
            nextLevel = nextCommitteeData.levels ? "level1" : null;
          } else {
            nextCommittee = "COMPLETED";
            nextLevel = null;
          }
        }
      } else {
        // Single-level committee - progress to next committee
        const nextCommitteeData = committees.find(
          (c) => c.order === currentCommittee.order + 1
        );
        if (nextCommitteeData) {
          nextCommittee = nextCommitteeData.id;
          nextLevel = nextCommitteeData.levels ? "level1" : null;
        } else {
          nextCommittee = "COMPLETED";
          nextLevel = null;
        }
      }

      const batch = writeBatch(db);

      // Record completion
      const completionRef = doc(collection(db, "completions"));
      batch.set(completionRef, {
        teamId,
        teamName: team.teamName,
        challengeId: completionId,
        committeeId,
        levelId,
        completionTime: serverTimestamp(),
        position,
        points,
      });

      // Update team progress
      const updateData = {
        score: (team.score || 0) + points,
        lastSubmissionTimestamp: serverTimestamp(),
        currentCommittee: nextCommittee,
      };

      if (nextLevel !== undefined) {
        updateData.currentLevel = nextLevel;
      }

      batch.update(doc(db, "teams", teamId), updateData);

      await batch.commit();
      alert(
        `Verified! ${teamName} got ${points} points (Position: ${position}${
          team?.assignedCommittee === committeeId ? " + 1 SCAB bonus" : ""
        })`
      );
    } catch (error) {
      console.error("Error verifying submission:", error);
      alert("Error verifying submission");
    } finally {
      setLoading(false);
    }
  };

  const resetTeamProgress = async (teamId) => {
    const teamName = teams.find((t) => t.id === teamId)?.teamName;
    if (
      !confirm(
        `Reset progress for ${teamName}? This will remove all completions and reset score.`
      )
    )
      return;

    setLoading(true);
    try {
      const batch = writeBatch(db);

      batch.update(doc(db, "teams", teamId), {
        score: 0,
        currentCommittee: "AIML",
        lastSubmissionTimestamp: null,
        goldenKnifeAccess: false,
      });

      for (const committee of committees) {
        const completionsQuery = query(
          collection(db, `committees/${committee.id}/completions`),
          where("teamId", "==", teamId)
        );
        const completions = await getDocs(completionsQuery);
        completions.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }

      await batch.commit();
      alert(`Reset progress for ${teamName}`);
    } catch (error) {
      console.error("Error resetting team:", error);
      alert("Error resetting team");
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (teamId) => {
    const teamName = teams.find((t) => t.id === teamId)?.teamName;
    if (!confirm(`DELETE team ${teamName}? This cannot be undone!`)) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "teams", teamId));
      alert(`Deleted team ${teamName}`);
    } catch (error) {
      console.error("Error deleting team:", error);
      alert("Error deleting team");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="border border-black p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold font-mono text-center mb-8">
            ADMIN LOGIN
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white p-2 font-bold hover:bg-gray-800"
            >
              LOGIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold font-mono">REBOOT ADMIN</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentTab("matchmaking")}
              className={`px-4 py-2 border border-black ${
                currentTab === "matchmaking"
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              MATCHMAKING
            </button>
            <button
              onClick={() => setCurrentTab("teams")}
              className={`px-4 py-2 border border-black ${
                currentTab === "teams"
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              TEAMS
            </button>
            <button
              onClick={() => setCurrentTab("submissions")}
              className={`px-4 py-2 border border-black ${
                currentTab === "submissions"
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              SUBMISSIONS
            </button>
            <button
              onClick={() => setCurrentTab("settings")}
              className={`px-4 py-2 border border-black ${
                currentTab === "settings"
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              SETTINGS
            </button>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2 border border-black bg-red-600 text-white"
          >
            LOGOUT
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {currentTab === "matchmaking" && (
          <MatchmakingTab
            teams={teams}
            performMatchmaking={performMatchmaking}
            loading={loading}
          />
        )}

        {currentTab === "teams" && (
          <TeamsTab
            teams={teams}
            resetTeamProgress={resetTeamProgress}
            deleteTeam={deleteTeam}
            loading={loading}
          />
        )}

        {currentTab === "submissions" && (
          <SubmissionsTab
            teams={teams}
            committees={committees}
            verifySubmission={verifySubmission}
            loading={loading}
          />
        )}

        {currentTab === "settings" && (
          <SettingsTab
            teams={teams}
            enableGlobalGameAccess={enableGlobalGameAccess}
            enableFinaleForTopPerCommittee={enableFinaleForTopPerCommittee}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}

function MatchmakingTab({ teams, performMatchmaking, loading }) {
  const incompleteTeams = teams.filter(
    (team) =>
      team.members.length < 5 &&
      team.openToMatchmaking &&
      !team.isMatchmade &&
      !team.mergedInto
  );

  const matchedTeams = teams.filter((team) => team.isMatchmade);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">TEAM MATCHMAKING</h2>

      <div className="border border-black p-6">
        <h3 className="text-lg font-bold mb-4">MATCHMAKING CONTROL</h3>
        <p className="mb-4">
          Teams available for matchmaking:{" "}
          <span className="font-bold">{incompleteTeams.length}</span>
        </p>
        <button
          onClick={performMatchmaking}
          disabled={loading || incompleteTeams.length < 2}
          className="bg-purple-600 text-white px-6 py-3 font-bold hover:bg-purple-700 disabled:opacity-50"
        >
          {loading
            ? "MATCHING..."
            : `PERFORM MATCHMAKING (${incompleteTeams.length} teams)`}
        </button>
        <p className="text-sm text-gray-600 mt-2">
          This will automatically match incomplete teams together (max 5 members
          total)
        </p>
      </div>

      <div className="border border-black p-6">
        <h3 className="text-lg font-bold mb-4">
          TEAMS AVAILABLE FOR MATCHMAKING
        </h3>
        {incompleteTeams.length === 0 ? (
          <div className="text-gray-500">
            No teams available for matchmaking
          </div>
        ) : (
          <div className="space-y-2">
            {incompleteTeams.map((team) => (
              <div
                key={team.id}
                className="flex justify-between items-center p-3 border border-gray-300"
              >
                <div>
                  <span className="font-mono font-bold">{team.teamName}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    ({team.members.length} member
                    {team.members.length !== 1 ? "s" : ""})
                  </span>
                </div>
                <div className="text-sm">
                  {team.members.map((member, index) => (
                    <div key={index}>
                      {member.name} ({member.rollNumber})
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-black p-6">
        <h3 className="text-lg font-bold mb-4">MATCHED TEAMS</h3>
        {matchedTeams.length === 0 ? (
          <div className="text-gray-500">No teams have been matched yet</div>
        ) : (
          <div className="space-y-2">
            {matchedTeams
              .filter((team) => !team.mergedInto)
              .map((team) => (
                <div
                  key={team.id}
                  className="p-3 border border-green-300 bg-green-50"
                >
                  <div className="font-mono font-bold">{team.teamName}</div>
                  <div className="text-sm text-gray-600">
                    Total members: {team.members.length}
                    {team.matchedWith && (
                      <span className="ml-2 text-green-700 font-bold">
                        (Matched with: {team.matchedWith})
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-1">
                    {team.members.map((member, index) => (
                      <span key={index} className="mr-3">
                        {member.name} ({member.rollNumber})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamsTab({ teams, resetTeamProgress, deleteTeam, loading }) {
  const activeTeams = teams.filter((team) => !team.mergedInto);
  const mergedTeams = teams.filter((team) => team.mergedInto);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">TEAM MANAGEMENT</h2>

      <div className="text-sm text-gray-600 mb-4">
        Active Teams: {activeTeams.length} | Merged Teams: {mergedTeams.length}{" "}
        | Total Teams: {teams.length}
      </div>

      {/* Active Teams */}
      <div className="border border-black overflow-hidden">
        <div className="bg-gray-100 p-3 font-bold text-lg border-b border-black">
          ACTIVE TEAMS
        </div>

        <div className="grid grid-cols-8 gap-2 p-3 border-b border-black bg-gray-50 font-bold text-sm">
          <div>TEAM NAME</div>
          <div>MEMBERS</div>
          <div>SCORE</div>
          <div>COMMITTEE</div>
          <div>CURRENT</div>
          <div>ACCESS</div>
          <div>FINALE</div>
          <div>ACTIONS</div>
        </div>

        {activeTeams.map((team) => (
          <div
            key={team.id}
            className={`grid grid-cols-8 gap-2 p-3 border-b border-gray-200 text-sm ${
              team.isMatchmade ? "bg-purple-50" : ""
            }`}
          >
            <div>
              <div className="font-mono">{team.teamName}</div>
              {team.isMatchmade && (
                <div className="text-xs text-purple-600 font-bold">
                  COMBINED WITH: {team.matchedWith}
                </div>
              )}
            </div>
            <div>
              <div className="font-bold">{team.members.length}/5</div>
              {team.isMatchmade && (
                <div className="text-xs text-purple-600">
                  Original: {team.originalMemberCount} + Added:{" "}
                  {team.mergedMemberCount}
                </div>
              )}
            </div>
            <div className="font-bold">{team.score || 0}</div>
            <div>{team.assignedCommittee || "N/A"}</div>
            <div>
              {team.currentCommittee || "N/A"}
              {team.currentLevel && (
                <div className="text-xs text-gray-500">
                  {team.currentLevel === "level1" ? "L1" : "L2"}
                </div>
              )}
            </div>
            <div>
              <span
                className={`px-2 py-1 text-xs ${
                  team.gameAccessEnabled
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {team.gameAccessEnabled ? "YES" : "NO"}
              </span>
            </div>
            <div>
              <span
                className={`px-2 py-1 text-xs ${
                  team.goldenKnifeAccess
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {team.goldenKnifeAccess ? "YES" : "NO"}
              </span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => resetTeamProgress(team.id)}
                disabled={loading}
                className="px-2 py-1 text-xs bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
              >
                RESET
              </button>
              <button
                onClick={() => deleteTeam(team.id)}
                disabled={loading}
                className="px-2 py-1 text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                DELETE
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Merged Teams */}
      {mergedTeams.length > 0 && (
        <div className="border border-black overflow-hidden">
          <div className="bg-purple-100 p-3 font-bold text-lg border-b border-black">
            MERGED TEAMS ({mergedTeams.length})
          </div>

          <div className="grid grid-cols-6 gap-2 p-3 border-b border-black bg-purple-50 font-bold text-sm">
            <div>ORIGINAL TEAM</div>
            <div>MEMBERS</div>
            <div>COMBINED INTO</div>
            <div>STATUS</div>
            <div>LOGIN INFO</div>
            <div>ACTIONS</div>
          </div>

          {mergedTeams.map((team) => (
            <div
              key={team.id}
              className="grid grid-cols-6 gap-2 p-3 border-b border-gray-200 text-sm bg-purple-25"
            >
              <div className="font-mono">{team.teamName}</div>
              <div>{team.members?.length || 0} original</div>
              <div className="font-bold text-purple-600">
                {team.mergedIntoTeam}
              </div>
              <div>
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800">
                  MERGED
                </span>
              </div>
              <div className="text-xs">
                <div>
                  Use: <strong>{team.mergedIntoTeam}</strong>
                </div>
                <div className="text-gray-500">for login</div>
              </div>
              <div>
                <button
                  onClick={() => deleteTeam(team.id)}
                  disabled={loading}
                  className="px-2 py-1 text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionsTab({ teams, committees, verifySubmission, loading }) {
  const [selectedCommittee, setSelectedCommittee] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const getTeamsForCommittee = (committeeId) => {
    let filteredTeams = teams.filter(
      (team) => team.currentCommittee === committeeId && !team.mergedInto
    );

    // Apply search filter
    if (searchTerm.trim()) {
      filteredTeams = filteredTeams.filter((team) =>
        team.teamName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredTeams;
  };

  const getTeamsForLevel = (committeeId, levelId) => {
    let filteredTeams = teams.filter(
      (team) =>
        team.currentCommittee === committeeId &&
        team.currentLevel === levelId &&
        !team.mergedInto
    );

    // Apply search filter
    if (searchTerm.trim()) {
      filteredTeams = filteredTeams.filter((team) =>
        team.teamName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredTeams;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">SUBMISSION VERIFICATION</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-bold mb-2">
            SELECT COMMITTEE
          </label>
          <select
            value={selectedCommittee}
            onChange={(e) => setSelectedCommittee(e.target.value)}
            className="w-full p-2 border border-black focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">All Committees</option>
            {committees.map((committee) => (
              <option key={committee.id} value={committee.id}>
                {committee.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">SEARCH TEAMS</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by team name..."
            className="w-full p-2 border border-black focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      {committees
        .filter(
          (committee) =>
            !selectedCommittee || committee.id === selectedCommittee
        )
        .map((committee) => {
          return (
            <div key={committee.id} className="border border-black p-4">
              <h3 className="text-lg font-bold mb-4">{committee.name}</h3>

              {/* Single Level Committee */}
              {!committee.levels && (
                <div className="mb-4">
                  <div className="font-semibold mb-2">
                    Challenge Submissions
                  </div>
                  {(() => {
                    const teamsForCommittee = getTeamsForCommittee(
                      committee.id
                    );
                    return (
                      <>
                        <div className="text-sm text-gray-600 mb-2">
                          Teams waiting: {teamsForCommittee.length}
                          {searchTerm &&
                            ` of ${
                              teams.filter(
                                (team) =>
                                  team.currentCommittee === committee.id &&
                                  !team.mergedInto
                              ).length
                            }`}
                        </div>

                        {teamsForCommittee.length === 0 ? (
                          <div className="text-gray-500 p-3 border border-gray-200">
                            {searchTerm
                              ? `No teams found matching "${searchTerm}" for this committee`
                              : "No teams waiting for this committee"}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {teamsForCommittee.map((team) => (
                              <div
                                key={team.id}
                                className="flex justify-between items-center p-3 border border-gray-300"
                              >
                                <div>
                                  <span className="font-mono font-bold">
                                    {team.teamName}
                                  </span>
                                  <span className="text-sm text-gray-600 ml-2">
                                    (Score: {team.score || 0}, Committee:{" "}
                                    {team.assignedCommittee}, Members:{" "}
                                    {team.members.length})
                                  </span>
                                  {team.isMatchmade && (
                                    <span className="text-xs text-purple-600 font-bold ml-2">
                                      MATCHED TEAM
                                    </span>
                                  )}
                                  {team.assignedCommittee === committee.id && (
                                    <span className="text-xs text-yellow-600 font-bold ml-2">
                                      SCAB (+1pt)
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    verifySubmission(team.id, committee.id)
                                  }
                                  disabled={loading}
                                  className="px-4 py-2 bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-50"
                                >
                                  VERIFY SUBMISSION
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Multi-Level Committee */}
              {committee.levels && (
                <div className="space-y-4">
                  {committee.levels.map((level) => {
                    const teamsForLevel = getTeamsForLevel(
                      committee.id,
                      level.id
                    );
                    return (
                      <div
                        key={level.id}
                        className="border border-gray-200 p-3"
                      >
                        <div className="font-semibold mb-2">
                          {level.name} Submissions
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          Teams waiting: {teamsForLevel.length}
                          {searchTerm &&
                            ` of ${
                              teams.filter(
                                (team) =>
                                  team.currentCommittee === committee.id &&
                                  team.currentLevel === level.id &&
                                  !team.mergedInto
                              ).length
                            }`}
                        </div>

                        {teamsForLevel.length === 0 ? (
                          <div className="text-gray-500 p-2 bg-gray-50">
                            {searchTerm
                              ? `No teams found matching "${searchTerm}" for ${level.name}`
                              : `No teams waiting for ${level.name}`}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {teamsForLevel.map((team) => (
                              <div
                                key={team.id}
                                className="flex justify-between items-center p-2 border border-gray-300 bg-blue-25"
                              >
                                <div>
                                  <span className="font-mono font-bold">
                                    {team.teamName}
                                  </span>
                                  <span className="text-sm text-gray-600 ml-2">
                                    (Score: {team.score || 0}, Committee:{" "}
                                    {team.assignedCommittee}, Members:{" "}
                                    {team.members.length})
                                  </span>
                                  {team.isMatchmade && (
                                    <span className="text-xs text-purple-600 font-bold ml-2">
                                      MATCHED TEAM
                                    </span>
                                  )}
                                  {team.assignedCommittee === committee.id && (
                                    <span className="text-xs text-yellow-600 font-bold ml-2">
                                      SCAB (+1pt)
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    verifySubmission(
                                      team.id,
                                      committee.id,
                                      level.id
                                    )
                                  }
                                  disabled={loading}
                                  className="px-4 py-2 bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-50"
                                >
                                  VERIFY {level.name.toUpperCase()}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

function SettingsTab({
  teams,
  enableGlobalGameAccess,
  enableFinaleForTopPerCommittee,
  loading,
}) {
  const activeTeams = teams.filter((team) => !team.mergedInto);
  const teamsWithoutAccess = activeTeams.filter(
    (team) => !team.gameAccessEnabled
  ).length;
  const teamsWithFinaleAccess = activeTeams.filter(
    (team) => team.goldenKnifeAccess
  ).length;

  // Group teams by committee for finale preview
  const teamsByCommittee = {};
  activeTeams.forEach((team) => {
    if (team.assignedCommittee) {
      if (!teamsByCommittee[team.assignedCommittee]) {
        teamsByCommittee[team.assignedCommittee] = [];
      }
      teamsByCommittee[team.assignedCommittee].push(team);
    }
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">GAME SETTINGS</h2>

      <div className="border border-black p-6">
        <h3 className="text-lg font-bold mb-4">GAME ACCESS CONTROL</h3>
        <p className="mb-4">
          Active teams without game access:{" "}
          <span className="font-bold">{teamsWithoutAccess}</span>
        </p>
        <button
          onClick={enableGlobalGameAccess}
          disabled={loading || teamsWithoutAccess === 0}
          className="bg-blue-600 text-white px-6 py-3 font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? "ENABLING..."
            : `ENABLE GAME ACCESS FOR ALL (${teamsWithoutAccess} teams)`}
        </button>
      </div>

      <div className="border border-black p-6">
        <h3 className="text-lg font-bold mb-4">FINALE ACCESS CONTROL</h3>
        <p className="mb-4">
          Current teams with finale access:{" "}
          <span className="font-bold">{teamsWithFinaleAccess}</span>
        </p>

        <div className="mb-4 p-4 bg-gray-50 border border-gray-300">
          <h4 className="font-bold mb-2">
            Finale Preview (Top team per committee):
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {Object.keys(teamsByCommittee).map((committeeId) => {
              const committeeTeams = teamsByCommittee[committeeId]
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .slice(0, 2);

              return (
                <div key={committeeId} className="p-2 border border-gray-200">
                  <div className="font-bold">{committeeId}:</div>
                  {committeeTeams.map((team, index) => (
                    <div key={team.id} className="text-xs">
                      {index + 1}. {team.teamName} ({team.score || 0} pts)
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={enableFinaleForTopPerCommittee}
          disabled={loading}
          className="bg-yellow-600 text-white px-6 py-3 font-bold hover:bg-yellow-700 disabled:opacity-50"
        >
          {loading ? "ENABLING..." : "ENABLE FINALE FOR TOP TEAM PER COMMITTEE"}
        </button>
      </div>

      <div className="border border-black p-6">
        <h3 className="text-lg font-bold mb-4">GAME STATISTICS</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 border border-gray-300 text-center">
            <div className="font-bold text-lg">{activeTeams.length}</div>
            <div>Active Teams</div>
          </div>
          <div className="p-3 border border-gray-300 text-center">
            <div className="font-bold text-lg">
              {teams.filter((t) => t.isMatchmade && !t.mergedInto).length}
            </div>
            <div>Matched Teams</div>
          </div>
          <div className="p-3 border border-gray-300 text-center">
            <div className="font-bold text-lg">
              {
                activeTeams.filter((t) => t.currentCommittee === "COMPLETED")
                  .length
              }
            </div>
            <div>Completed</div>
          </div>
          <div className="p-3 border border-gray-300 text-center">
            <div className="font-bold text-lg">{teamsWithFinaleAccess}</div>
            <div>Finale Access</div>
          </div>
        </div>
      </div>
    </div>
  );
}
