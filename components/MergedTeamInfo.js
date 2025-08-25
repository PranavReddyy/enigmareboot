"use client";

export default function MergedTeamInfo({ team }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="border border-black p-8 w-full max-w-2xl text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-purple-600">M</span>
          </div>
          <h1 className="text-3xl font-bold font-mono mb-4">TEAM MERGED</h1>
          <p className="text-gray-600 mb-6">
            Your team has been successfully combined with another team
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">MERGER DETAILS</h2>

          <div className="space-y-3 text-left">
            <div className="flex justify-between">
              <span className="font-medium">Your Team Name:</span>
              <span className="font-bold">{team.teamName}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Combined With:</span>
              <span className="font-bold text-purple-600">
                {team.mergedIntoTeam}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Your Members:</span>
              <span className="font-bold">{team.members?.length || 0}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Login With:</span>
              <span className="font-bold text-green-600">
                {team.mergedIntoTeam} (combined team)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
          <h3 className="font-bold mb-2">WHAT HAPPENS NEXT?</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              • Your team members are now part of team:{" "}
              <strong>{team.mergedIntoTeam}</strong>
            </p>
            <p>• Use the combined team name and password to login</p>
            <p>• All progress will be tracked under the combined team</p>
            <p>• Coordinate with your new teammates</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
          <h3 className="font-bold mb-2">YOUR ORIGINAL TEAM MEMBERS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {team.members?.map((member, index) => (
              <div
                key={index}
                className="flex justify-between p-2 bg-white border border-gray-200"
              >
                <span>{member.name}</span>
                <span className="text-gray-500">{member.rollNumber}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 p-4">
          <p className="text-sm font-bold text-green-800">
            💡 To continue: Login with team name{" "}
            <strong>{team.mergedIntoTeam}</strong> and its password
          </p>
        </div>
      </div>
    </div>
  );
}
