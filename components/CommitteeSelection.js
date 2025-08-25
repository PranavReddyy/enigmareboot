"use client";

import { useState, useEffect } from "react";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import BinaryBackground from "./BinaryBackground";

const COMMITTEE_INFO = {
  AIML: {
    name: "AI/ML Committee",
    description: "Artificial Intelligence and Machine Learning",
    icon: "🧠",
  },
  CyberSec: {
    name: "Cyber Security Committee",
    description: "Digital Security and Protection",
    icon: "🔒",
  },
  WebDev: {
    name: "Web Development Committee",
    description: "Frontend and Backend Development",
    icon: "🌐",
  },
  SysCom: {
    name: "Systems Committee",
    description: "System Administration and Optimization",
    icon: "⚙️",
  },
  GameDev: {
    name: "Game Development Committee",
    description: "Interactive Entertainment Development",
    icon: "🎮",
  },
};

const LOADING_MESSAGES = [
  "Analyzing team personality...",
  "Processing interests and skills...",
  "Evaluating technical preferences...",
  "Matching with committee cultures...",
  "Calculating optimal assignment...",
  "Finalizing recommendation...",
];

export default function CommitteeSelection({ team, onComplete }) {
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [assignedCommittee, setAssignedCommittee] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const getBalancedCommittee = async () => {
    // Get current committee counts
    const committees = Object.keys(COMMITTEE_INFO);
    const committeeCounts = {};

    for (const committee of committees) {
      const q = query(
        collection(db, "teams"),
        where("assignedCommittee", "==", committee)
      );
      const snapshot = await getDocs(q);
      committeeCounts[committee] = snapshot.size;
    }

    // Find committee with minimum count
    const minCount = Math.min(...Object.values(committeeCounts));
    const availableCommittees = committees.filter(
      (committee) => committeeCounts[committee] === minCount
    );

    // Randomly select from committees with minimum count
    return availableCommittees[
      Math.floor(Math.random() * availableCommittees.length)
    ];
  };

  const handleAnalyze = async () => {
    if (!description.trim()) return;

    setIsAnalyzing(true);

    // Cycle through loading messages
    for (let i = 0; i < LOADING_MESSAGES.length; i++) {
      setLoadingMessage(LOADING_MESSAGES[i]);
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    // Get balanced committee assignment
    const committee = await getBalancedCommittee();
    setAssignedCommittee(committee);
    setIsAnalyzing(false);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await updateDoc(doc(db, "teams", team.id), {
        assignedCommittee: assignedCommittee,
        teamDescription: description,
      });

      onComplete({ ...team, assignedCommittee });
    } catch (error) {
      console.error("Error updating team:", error);
    } finally {
      setConfirming(false);
    }
  };

  if (assignedCommittee) {
    const committee = COMMITTEE_INFO[assignedCommittee];

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <BinaryBackground />
        <div className="border border-black p-8 w-full max-w-2xl text-center">
          <h1 className="text-3xl font-bold font-mono mb-8">
            AI ANALYSIS COMPLETE
          </h1>

          <div className="border-2 border-black p-8 mb-8">
            <div className="text-6xl mb-4">{committee.icon}</div>
            <h2 className="text-2xl font-bold mb-2">{committee.name}</h2>
            <p className="text-lg text-gray-600 mb-4">
              {committee.description}
            </p>
          </div>

          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="bg-black text-white px-8 py-3 font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            {confirming ? "CONFIRMING..." : "CONTINUE TO GAME"}
          </button>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <BinaryBackground />
        <div className="border border-black p-8 w-full max-w-2xl text-center">
          <h1 className="text-3xl font-bold font-mono mb-8">
            AI PROCESSING...
          </h1>

          <div className="mb-8">
            <div className="animate-spin w-16 h-16 border-4 border-black border-t-transparent rounded-full mx-auto mb-6"></div>
            <div className="text-lg font-bold mb-4">{loadingMessage}</div>
            <div className="w-full bg-gray-200 h-2 rounded">
              <div className="bg-black h-2 rounded animate-pulse"></div>
            </div>
          </div>

          <div className="text-sm text-gray-600 bg-gray-100 p-4 border border-gray-300">
            <div className="font-bold mb-2">Our AI is analyzing:</div>
            <div className="text-left space-y-1">
              <div>• Team personality traits</div>
              <div>• Technical interests</div>
              <div>• Collaboration style</div>
              <div>• Optimal committee match</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <BinaryBackground />
      <div className="border border-black p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono mb-4">
            COMMITTEE ASSIGNMENT
          </h1>
          <p className="text-lg text-gray-600">
            Our AI will analyze your team and assign the perfect committee
          </p>
        </div>

        <div className="mb-8">
          <label className="block text-lg font-bold mb-4">
            Describe your team and members in a few sentences:
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us about your team's interests, skills, backgrounds, what excites you about technology, your goals for this competition..."
            className="w-full h-32 p-4 border border-black focus:outline-none focus:ring-2 focus:ring-black resize-none"
            required
          />
          <div className="text-sm text-gray-500 mt-2">
            Minimum 20 characters • Be descriptive for better AI analysis
          </div>
        </div>

        <div className="mb-6 p-4 border border-gray-300 bg-gray-50">
          <div className="font-bold mb-2">How our AI assignment works:</div>
          <div className="text-sm space-y-1">
            <div>• Analyzes team personality and interests</div>
            <div>• Matches with committee cultures and focus areas</div>
            <div>• Ensures balanced distribution across all committees</div>
            <div>• Assigns SCAB bonus committee for extra points</div>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={description.length < 20 || isAnalyzing}
          className="w-full bg-black text-white p-3 font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {description.length < 20
            ? `WRITE MORE (${20 - description.length} chars needed)`
            : "ANALYZE WITH AI"}
        </button>
      </div>
    </div>
  );
}
