"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BinaryBackground from "@/components/BinaryBackground";
import { useTeam } from "@/contexts/TeamContext";

export default function LoginForm({ onRegister }) {
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setTeam, loading, setLoading } = useTeam();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const q = query(
        collection(db, "teams"),
        where("teamName", "==", teamName),
        where("password", "==", password)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Invalid team name or password");
        return;
      }

      const teamDoc = querySnapshot.docs[0];
      const teamData = { id: teamDoc.id, ...teamDoc.data() };

      setTeam(teamData);
    } catch (err) {
      setError("Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <BinaryBackground />
      <div className="border border-black p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold font-mono text-center mb-8">
          REBOOT
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">TEAM NAME</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full p-2 border border-black focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

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

          {error && (
            <div className="text-red-600 text-sm font-bold">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-2 font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-300 pt-6">
          <p className="text-sm mb-3">Don&apos;t have a team?</p>
          <button
            onClick={onRegister}
            className="w-full border border-black bg-white text-black p-2 font-bold hover:bg-gray-100"
          >
            CREATE NEW TEAM
          </button>
        </div>
      </div>
    </div>
  );
}
