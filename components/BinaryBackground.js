"use client";

import { useEffect, useState } from "react";

export default function BinaryBackground() {
  const [binaryPattern, setBinaryPattern] = useState("");

  useEffect(() => {
    const generatePattern = () => {
      const rows = 200; // Number of rows
      const cols = 200; // Characters per row
      let pattern = "";

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          pattern += Math.random() > 0.5 ? "1" : "0";
          if (j % 8 === 7 && j < cols - 1) pattern += " "; // Space every 8 chars
        }
        pattern += "\n";
      }

      return pattern;
    };

    setBinaryPattern(generatePattern());

    // Regenerate pattern every 10 seconds for subtle changes
    const interval = setInterval(() => {
      setBinaryPattern(generatePattern());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] select-none">
        <pre className="font-mono text-xs text-gray-700 leading-4 p-4 transform rotate-[-1deg] scale-110">
          {binaryPattern}
        </pre>
      </div>

      {/* Additional floating binary elements */}
      <div className="absolute top-10 left-10 opacity-[0.05] font-mono text-xs text-gray-400 animate-pulse">
        01110010 01100101 01100010 01101111 01101111 01110100
      </div>
      <div
        className="absolute top-32 right-20 opacity-[0.05] font-mono text-xs text-gray-400 animate-pulse"
        style={{ animationDelay: "2s" }}
      >
        01101010 01101111 01101001 01101110 00100000 01110101 01110011
      </div>
      <div
        className="absolute bottom-20 left-32 opacity-[0.05] font-mono text-xs text-gray-400 animate-pulse"
        style={{ animationDelay: "4s" }}
      >
        01100010 01101111 01110100
      </div>
      <div
        className="absolute bottom-40 right-40 opacity-[0.05] font-mono text-xs text-gray-400 animate-pulse"
        style={{ animationDelay: "6s" }}
      >
        01110111 01100101 00100000 01100001 01110010 01100101 00100000 01100101
        <br />
        01101110 01101001 01100111 01101101 01100001
      </div>
    </div>
  );
}
