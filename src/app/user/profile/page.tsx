export default function UserProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and goals</p>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
            <input
              type="text"
              defaultValue="John Doe"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <input
              type="email"
              defaultValue="john@example.com"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Age</label>
            <input
              type="number"
              defaultValue="30"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Height (ft)</label>
            <input
              type="number"
              step="0.1"
              defaultValue="5.8"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Goals & Progress */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Goals & Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Current Weight (kg)</label>
            <input
              type="number"
              defaultValue="75"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Goal Weight (kg)</label>
            <input
              type="number"
              defaultValue="70"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Activity Level</label>
            <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
              <option>Light</option>
              <option selected>Moderate</option>
              <option>High</option>
              <option>Very High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fitness Goals */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Fitness Goals</h2>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input type="checkbox" checked className="rounded border-border" />
            <span className="text-foreground">Weight Loss</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded border-border" />
            <span className="text-foreground">Muscle Gain</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded border-border" />
            <span className="text-foreground">Improve Endurance</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded border-border" />
            <span className="text-foreground">Get Stronger</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          Save Changes
        </button>
      </div>
    </div>
  );
}
