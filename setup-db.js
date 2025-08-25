const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  writeBatch,
} = require("firebase/firestore");

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA9a41Cxds49uJYWk_4w9sd70wwaHwe1kE",
  authDomain: "enigma-75e32.firebaseapp.com",
  projectId: "enigma-75e32",
  storageBucket: "enigma-75e32.firebasestorage.app",
  messagingSenderId: "70142669475",
  appId: "1:70142669475:web:e8cc9f1c512c1f0c210516",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COMMITTEES_DATA = [
  {
    id: "AIML",
    name: "AI/ML Committee",
    order: 1,
    levels: [
      {
        id: "level1",
        name: "Level 1",
        challenge: {
          text: "AI/ML Challenge - Level 1\n\nSolve the basic machine learning problem.",
          link: "https://forms.gle/YourAIMLLevel1Form",
        },
      },
      {
        id: "level2",
        name: "Level 2",
        challenge: {
          text: "AI/ML Challenge - Level 2\n\nAdvanced deep learning challenge.",
          link: "https://forms.gle/YourAIMLLevel2Form",
        },
      },
    ],
  },
  {
    id: "SysCom",
    name: "Systems Committee",
    order: 2,
    challenge: {
      text: "Systems Administration Challenge\n\nOptimize the given system configuration.",
      link: "https://forms.gle/YourSysComForm",
    },
  },
  {
    id: "CyberSec",
    name: "Cyber Security Committee",
    order: 3,
    levels: [
      {
        id: "level1",
        name: "Level 1",
        challenge: {
          text: "Cyber Security Challenge - Level 1\n\nFind the basic vulnerability.",
          link: "https://forms.gle/YourCyberSecLevel1Form",
        },
      },
      {
        id: "level2",
        name: "Level 2",
        challenge: {
          text: "Cyber Security Challenge - Level 2\n\nAdvanced penetration testing.",
          link: "https://forms.gle/YourCyberSecLevel2Form",
        },
      },
    ],
  },
  {
    id: "GameDev",
    name: "Game Development Committee",
    order: 4,
    challenge: {
      text: "Game Development Challenge\n\nCreate the game mechanics as specified.",
      link: "https://forms.gle/YourGameDevForm",
    },
  },
  {
    id: "WebDev",
    name: "Web Development Committee",
    order: 5,
    levels: [
      {
        id: "level1",
        name: "Level 1",
        challenge: {
          text: "Web Development Challenge - Level 1\n\nBuild a basic responsive webpage.",
          link: "https://forms.gle/YourWebDevLevel1Form",
        },
      },
      {
        id: "level2",
        name: "Level 2",
        challenge: {
          text: "Web Development Challenge - Level 2\n\nFull-stack application with database.",
          link: "https://forms.gle/YourWebDevLevel2Form",
        },
      },
    ],
  },
];

async function setupDatabase() {
  console.log("🎯 REBOOT Database Setup Starting...\n");

  try {
    console.log("🚀 Setting up committees with new flow...");

    const batch = writeBatch(db);

    for (const committee of COMMITTEES_DATA) {
      const docRef = doc(db, "committees", committee.id);
      batch.set(docRef, committee);
    }

    await batch.commit();
    console.log("✅ Successfully created all committees!");

    // Log the committees created
    COMMITTEES_DATA.forEach((committee) => {
      console.log(`   📋 ${committee.name} (Order: ${committee.order})`);
      if (committee.levels) {
        committee.levels.forEach((level) => {
          console.log(`      └─ ${level.name}`);
        });
      }
    });

    console.log("\n🎉 Database setup complete!");
    console.log("\n📝 Committee Flow:");
    console.log(
      "   AI/ML (L1 → L2) → SysCom → CyberSec (L1 → L2) → GameDev → WebDev (L1 → L2)"
    );
    console.log("\n📝 Next steps:");
    console.log("   1. Update challenge text and links in Firebase console");
    console.log("   2. Teams will progress through levels sequentially");
    console.log("   3. Use /admin to manage the competition");
    console.log("   4. Admin password: reboot2025");

    process.exit(0);
  } catch (error) {
    console.error("💥 Setup failed:", error);
    process.exit(1);
  }
}

setupDatabase();
