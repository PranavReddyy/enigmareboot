"use client";

import { useState, useEffect } from "react";
import { useTeam } from "@/contexts/TeamContext";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ChallengeModal from "./ChallengeModal";

export default function GameDashboard() {
  const { team } = useTeam();
  const [committees, setCommittees] = useState([]);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "committees"), orderBy("order")),
      (snapshot) => {
        const committeesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCommittees(committeesData);
      }
    );

    return unsubscribe;
  }, []);

  const handleChallengeClick = (committee, level = null) => {
    if (isChallengeLocked(committee, level)) return;

    if (level) {
      setCurrentChallenge({
        ...committee,
        currentLevel: level,
        challenge: level.challenge,
        name: `${committee.name} - ${level.name}`,
      });
    } else {
      setCurrentChallenge(committee);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentChallenge(null);
  };

  const isChallengeLocked = (committee, level = null) => {
    const currentCommittee = team.currentCommittee || "AIML";
    const currentLevel = team.currentLevel || "level1";

    const currentCommitteeOrder =
      committees.find((c) => c.id === currentCommittee)?.order || 1;
    const targetCommitteeOrder = committee.order;

    if (targetCommitteeOrder > currentCommitteeOrder) return true;
    if (targetCommitteeOrder < currentCommitteeOrder) return false;

    if (targetCommitteeOrder === currentCommitteeOrder) {
      if (!level) return false;
      if (level.id === "level1") return false;
      if (level.id === "level2" && currentLevel === "level2") return false;
      return true;
    }

    return true;
  };

  const getChallengeStatus = (committee, level = null) => {
    const currentCommittee = team.currentCommittee || "AIML";
    const currentLevel = team.currentLevel || "level1";

    const currentCommitteeOrder =
      committees.find((c) => c.id === currentCommittee)?.order || 1;
    const targetCommitteeOrder = committee.order;

    if (targetCommitteeOrder < currentCommitteeOrder) return "completed";
    if (targetCommitteeOrder > currentCommitteeOrder) return "locked";

    if (!level) return "current";

    if (level.id === "level1") {
      if (currentLevel === "level1") return "current";
      return "completed";
    }

    if (level.id === "level2") {
      if (currentLevel === "level2") return "current";
      if (currentLevel === "level1") return "locked";
      return "completed";
    }

    return "locked";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Finale - Moved to top with gold styling */}
      {team.goldenKnifeAccess && (
        <div className="bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-400 border-2 border-yellow-200 p-6 text-center shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/knife.png"
              alt="Golden Knife"
              className="h-8 w-8 object-contain mr-3"
            />
            <h2 className="text-2xl font-bold font-mono text-yellow-900">
              FINALE UNLOCKED
            </h2>
          </div>
          <p className="text-yellow-800 mb-4 font-semibold">
            Congratulations! You have qualified for the final challenge.
          </p>
          <a
            href="https://meet.google.com/your-finale-link"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-yellow-900 text-yellow-100 px-8 py-3 font-bold border-2 border-yellow-900 hover:bg-yellow-800 transition-colors shadow-md"
          >
            JOIN FINALE
          </a>
        </div>
      )}

      {/* Header */}
      <div className="pt-10 text-center">
        <h1 className="text-3xl font-bold font-mono mb-2">CHALLENGE TRACKER</h1>
        <p className="text-gray-600">
          Current:{" "}
          {committees.find((c) => c.id === team.currentCommittee)?.name ||
            "AI/ML Committee"}
          {team.currentLevel &&
            ` - Level ${team.currentLevel === "level1" ? "1" : "2"}`}
        </p>
        <p className="text-sm mt-2 font-mono">
          Score: <span className="font-bold">{team.score || 0}</span>
        </p>
      </div>

      {/* Progress Flow */}
      <div className="border border-black p-4 bg-gray-50 text-center">
        <div className="text-sm font-mono space-x-2">
          <span>AI/ML</span>
          <span>→</span>
          <span>SysCom</span>
          <span>→</span>
          <span>CyberSec</span>
          <span>→</span>
          <span>GameDev</span>
          <span>→</span>
          <span>WebDev</span>
        </div>
      </div>

      {/* Committees */}
      <div className="space-y-4">
        {committees.map((committee) => {
          const isScab = team.assignedCommittee === committee.id;

          return (
            <div
              key={committee.id}
              className={`border-2 border-black p-4 ${
                isScab ? "bg-yellow-50" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold font-mono">
                  {committee.name}
                </h3>
                {isScab && (
                  <span className="text-xs bg-black text-white px-2 py-1 font-mono">
                    SCAB +1
                  </span>
                )}
              </div>

              {/* Single Level */}
              {!committee.levels && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 border-2 border-black ${
                        getChallengeStatus(committee) === "completed"
                          ? "bg-black"
                          : getChallengeStatus(committee) === "current"
                          ? "bg-gray-400"
                          : "bg-white"
                      }`}
                    ></div>
                    <span className="font-mono">CHALLENGE</span>
                  </div>

                  <button
                    onClick={() => handleChallengeClick(committee)}
                    disabled={isChallengeLocked(committee)}
                    className={`px-4 py-2 text-sm font-bold border-2 border-black transition-colors ${
                      isChallengeLocked(committee)
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : getChallengeStatus(committee) === "completed"
                        ? "bg-white text-black hover:bg-gray-100"
                        : "bg-black text-white hover:bg-gray-800"
                    }`}
                  >
                    {getChallengeStatus(committee) === "completed"
                      ? "REVIEW"
                      : getChallengeStatus(committee) === "current"
                      ? "START"
                      : "LOCKED"}
                  </button>
                </div>
              )}

              {/* Multi-Level */}
              {committee.levels && (
                <div className="space-y-3">
                  {committee.levels.map((level) => (
                    <div
                      key={level.id}
                      className="flex items-center justify-between border border-black p-3 bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 border-2 border-black ${
                            getChallengeStatus(committee, level) === "completed"
                              ? "bg-black"
                              : getChallengeStatus(committee, level) ===
                                "current"
                              ? "bg-gray-400"
                              : "bg-white"
                          }`}
                        ></div>
                        <span className="font-mono font-bold">
                          {level.name}
                        </span>
                      </div>

                      <button
                        onClick={() => handleChallengeClick(committee, level)}
                        disabled={isChallengeLocked(committee, level)}
                        className={`px-4 py-2 text-sm font-bold border-2 border-black transition-colors ${
                          isChallengeLocked(committee, level)
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : getChallengeStatus(committee, level) ===
                              "completed"
                            ? "bg-white text-black hover:bg-gray-100"
                            : "bg-black text-white hover:bg-gray-800"
                        }`}
                      >
                        {getChallengeStatus(committee, level) === "completed"
                          ? "REVIEW"
                          : getChallengeStatus(committee, level) === "current"
                          ? "START"
                          : "LOCKED"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && currentChallenge && (
        <ChallengeModal
          challenge={currentChallenge}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
