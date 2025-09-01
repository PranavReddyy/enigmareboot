// "use client";

// import { useEffect } from "react";

// export default function ChallengeModal({ challenge, onClose }) {
//   // Prevent body scroll when modal is open
//   useEffect(() => {
//     // Save current body overflow style
//     const originalStyle = window.getComputedStyle(document.body).overflow;

//     // Prevent scrolling
//     document.body.style.overflow = "hidden";

//     // Cleanup function to restore scroll when modal closes
//     return () => {
//       document.body.style.overflow = originalStyle;
//     };
//   }, []);

//   // Close modal on escape key
//   useEffect(() => {
//     const handleEscape = (event) => {
//       if (event.key === "Escape") {
//         onClose();
//       }
//     };

//     document.addEventListener("keydown", handleEscape);
//     return () => document.removeEventListener("keydown", handleEscape);
//   }, [onClose]);

//   // Close modal on backdrop click
//   const handleBackdropClick = (e) => {
//     if (e.target === e.currentTarget) {
//       onClose();
//     }
//   };

//   return (
//     <div
//       className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
//       onClick={handleBackdropClick}
//     >
//       <div className="bg-white border-2 border-black max-w-3xl w-full max-h-[85vh] overflow-hidden">
//         {/* Header */}
//         <div className="bg-black text-white p-6">
//           <div className="flex items-center justify-between">
//             <h2 className="text-2xl font-bold font-mono">{challenge.name}</h2>
//             <button
//               onClick={onClose}
//               className="text-2xl hover:text-gray-300 transition-colors"
//               aria-label="Close modal"
//             >
//               ×
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-8 overflow-y-auto max-h-[calc(85vh-140px)]">
//           {challenge.challenge?.text && (
//             <div className="mb-8">
//               <div className="border border-black p-6">
//                 <h3 className="text-lg font-bold mb-4 font-mono">
//                   CHALLENGE DESCRIPTION
//                 </h3>
//                 <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
//                   {challenge.challenge.text}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Action Section */}
//           {challenge.challenge?.link ? (
//             <div className="border border-black p-6 text-center">
//               <h3 className="text-lg font-bold mb-4 font-mono">
//                 SUBMIT YOUR SOLUTION
//               </h3>
//               <a
//                 href={challenge.challenge.link}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="inline-block bg-black text-white px-8 py-3 font-bold hover:bg-gray-800 transition-colors border border-black"
//               >
//                 OPEN CHALLENGE FORM
//               </a>
//             </div>
//           ) : (
//             <div className="border border-black p-6 text-center bg-gray-100">
//               <span className="text-gray-600 font-mono">
//                 CHALLENGE LINK NOT AVAILABLE
//               </span>
//             </div>
//           )}

//           {/* Instructions */}
//           <div className="mt-6 border border-black p-4 bg-gray-50">
//             <ul className="list-disc list-inside">
//               <li>Complete it quick</li>
//               <li>Slam the duck first</li>
//             </ul>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="border-t border-black p-4 bg-gray-50">
//           <div className="flex justify-between items-center">
//             <span className="text-sm text-gray-600 font-mono">GOOD LUCK!</span>
//             <button
//               onClick={onClose}
//               className="bg-white border border-black px-4 py-2 font-bold hover:bg-gray-100 transition-colors"
//             >
//               CLOSE
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect } from "react";

export default function ChallengeModal({ challenge, onClose }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Close modal on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border-2 border-black max-w-3xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-black text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-mono">{challenge.name}</h2>
            <button
              onClick={onClose}
              className="text-2xl hover:text-gray-300 transition-colors"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(85vh-140px)]">
          {challenge.challenge?.text && (
            <div className="mb-8">
              <div className="border border-black p-6">
                <h3 className="text-lg font-bold mb-4 font-mono">
                  CHALLENGE DESCRIPTION
                </h3>
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {challenge.challenge.text}
                </div>
              </div>
            </div>
          )}

          {/* Action Section */}
          {challenge.challenge?.link ? (
            <div className="border border-black p-6 text-center">
              <h3 className="text-lg font-bold mb-4 font-mono">
                CHALLENGE FORM
              </h3>
              <a
                href={challenge.challenge.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-black text-white px-8 py-3 font-bold hover:bg-gray-800 transition-colors border border-black"
              >
                OPEN FORM
              </a>
            </div>
          ) : (
            <div className="border border-black p-6 text-center bg-gray-100">
              <span className="text-gray-600 font-mono">
                CHALLENGE FORM NOT AVAILABLE
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-black p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 font-mono">
              ARCHIVE MODE
            </span>
            <button
              onClick={onClose}
              className="bg-white border border-black px-4 py-2 font-bold hover:bg-gray-100 transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
