"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TeamContext = createContext();

export function TeamProvider({ children }) {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (team?.id) {
      const unsubscribe = onSnapshot(doc(db, "teams", team.id), (doc) => {
        if (doc.exists()) {
          setTeam({ id: doc.id, ...doc.data() });
        }
      });
      return unsubscribe;
    }
  }, [team?.id]);

  return (
    <TeamContext.Provider value={{ team, setTeam, loading, setLoading }}>
      {children}
    </TeamContext.Provider>
  );
}

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within TeamProvider");
  }
  return context;
};
