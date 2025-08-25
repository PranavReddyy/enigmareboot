"use client";

import { useState } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BinaryBackground from "./BinaryBackground";

export default function TeamFormation({ onComplete }) {
  const [formData, setFormData] = useState({
    teamName: "",
    password: "",
    members: [{ name: "", rollNumber: "" }],
    openToMatchmaking: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addMember = () => {
    if (formData.members.length < 5) {
      setFormData({
        ...formData,
        members: [...formData.members, { name: "", rollNumber: "" }],
      });
    }
  };

  const removeMember = (index) => {
    if (formData.members.length > 1) {
      const newMembers = formData.members.filter((_, i) => i !== index);
      setFormData({ ...formData, members: newMembers });
    }
  };

  const updateMember = (index, field, value) => {
    const newMembers = [...formData.members];
    newMembers[index][field] = value;
    setFormData({ ...formData, members: newMembers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Check if team name already exists
      const q = query(
        collection(db, "teams"),
        where("teamName", "==", formData.teamName)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError("Team name already exists. Please choose a different name.");
        return;
      }

      // Validate form data
      if (
        formData.members.some(
          (member) => !member.name.trim() || !member.rollNumber.trim()
        )
      ) {
        setError("Please fill in all member details.");
        return;
      }

      // Create team document
      const teamData = {
        teamName: formData.teamName,
        password: formData.password,
        members: formData.members,
        openToMatchmaking: formData.openToMatchmaking,
        isMatchmade: false,
        originalTeamId: null,
        assignedCommittee: null,
        gameAccessEnabled: false,
        score: 0,
        currentCommittee: "AIML", // Start with AI/ML
        currentLevel: "level1", // Start with Level 1
        goldenKnifeAccess: false,
        lastSubmissionTimestamp: null,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "teams"), teamData);
      onComplete({ id: docRef.id, ...teamData });
    } catch (err) {
      setError("Failed to create team. Please try again.");
      console.error("Team creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isTeamIncomplete = formData.members.length < 5;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <BinaryBackground />
      <div className="border border-black p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold font-mono text-center mb-8">
          TEAM FORMATION
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">TEAM NAME</label>
              <input
                type="text"
                value={formData.teamName}
                onChange={(e) =>
                  setFormData({ ...formData, teamName: e.target.value })
                }
                className="w-full p-2 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">PASSWORD</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full p-2 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">TEAM MEMBERS (1-5)</h3>
              <button
                type="button"
                onClick={addMember}
                disabled={formData.members.length >= 5}
                className="bg-black text-white px-3 py-1 text-sm font-bold disabled:opacity-50"
              >
                + ADD MEMBER
              </button>
            </div>

            {formData.members.map((member, index) => (
              <div key={index} className="border border-gray-300 p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold">Member {index + 1}</h4>
                  {formData.members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="text-red-600 font-bold text-sm"
                    >
                      REMOVE
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">NAME</label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) =>
                        updateMember(index, "name", e.target.value)
                      }
                      className="w-full p-2 border border-black focus:outline-none focus:ring-1 focus:ring-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">
                      ROLL NUMBER
                    </label>
                    <input
                      type="text"
                      value={member.rollNumber}
                      onChange={(e) =>
                        updateMember(index, "rollNumber", e.target.value)
                      }
                      className="w-full p-2 border border-black focus:outline-none focus:ring-1 focus:ring-black"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Matchmaking Option */}
          {isTeamIncomplete && (
            <div className="border-2 border-blue-200 bg-blue-50 p-4 rounded">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="matchmaking"
                  checked={formData.openToMatchmaking}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      openToMatchmaking: e.target.checked,
                    })
                  }
                  className="mt-1"
                />
                <div>
                  <label
                    htmlFor="matchmaking"
                    className="font-bold text-sm cursor-pointer"
                  >
                    OPEN TO TEAM MATCHMAKING
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Your team has {formData.members.length} member
                    {formData.members.length !== 1 ? "s" : ""}. Check this if
                    you&apos;re open to being matched with other incomplete
                    teams to form a complete team of up to 5 members.
                  </p>
                  <p className="text-xs text-blue-600 mt-2 font-bold">
                    ⚡ Teams will be automatically matched by admins before the
                    competition starts
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm font-bold">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-3 font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "CREATING TEAM..." : "CREATE TEAM"}
          </button>
        </form>
      </div>
    </div>
  );
}
