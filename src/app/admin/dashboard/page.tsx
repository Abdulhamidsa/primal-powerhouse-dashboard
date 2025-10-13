export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your fitness business</p>
        </div>
      </div>

      {/* Admin Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Total Clients</h3>
          <p className="text-2xl font-bold text-primary">24</p>
          <p className="text-sm text-muted-foreground">+3 this month</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Active Plans</h3>
          <p className="text-2xl font-bold text-primary">18</p>
          <p className="text-sm text-muted-foreground">75% engagement</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Total Meals</h3>
          <p className="text-2xl font-bold text-primary">156</p>
          <p className="text-sm text-muted-foreground">Recipe library</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Videos</h3>
          <p className="text-2xl font-bold text-primary">42</p>
          <p className="text-sm text-muted-foreground">Training content</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Quick Actions</h3>
          <div className="space-y-2">
            <a href="/admin/clients" className="block text-primary hover:underline">
              Manage Clients
            </a>
            <a href="/admin/meals" className="block text-primary hover:underline">
              Add New Meal
            </a>
            <a href="/admin/videos" className="block text-primary hover:underline">
              Upload Video
            </a>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Recent Activity</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• New client registered</p>
            <p>• Meal plan updated</p>
            <p>• Video uploaded</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">System Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-foreground">Database: Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-foreground">API: Healthy</span>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Performance</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Response time: 120ms</p>
            <p>Uptime: 99.9%</p>
            <p>Active users: 45</p>
          </div>
        </div>
      </div>
    </div>
  );
}
