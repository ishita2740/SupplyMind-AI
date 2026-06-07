'use client'

import { useState } from 'react'
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    company: 'TechFlow Supply Co',
    industry: 'Technology',
  })

  const [preferences, setPreferences] = useState({
    notifications: true,
    emailAlerts: true,
    weeklyReport: true,
    currency: 'USD',
    theme: 'light',
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="text-primary" size={28} />
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          </div>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>

        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600" />
            <span className="text-green-700">Settings saved successfully!</span>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Company</label>
              <input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Industry</label>
              <select
                value={profile.industry}
                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>Technology</option>
                <option>Manufacturing</option>
                <option>Retail</option>
                <option>Healthcare</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Enable Notifications</p>
                <p className="text-sm text-muted-foreground">Get alerts for important supply chain events</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.notifications}
                onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })}
                className="w-5 h-5 rounded border-border accent-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Alerts</p>
                <p className="text-sm text-muted-foreground">Receive email notifications for critical alerts</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailAlerts}
                onChange={(e) => setPreferences({ ...preferences, emailAlerts: e.target.checked })}
                className="w-5 h-5 rounded border-border accent-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Weekly Report</p>
                <p className="text-sm text-muted-foreground">Receive weekly supply chain summaries</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.weeklyReport}
                onChange={(e) => setPreferences({ ...preferences, weeklyReport: e.target.checked })}
                className="w-5 h-5 rounded border-border accent-primary"
              />
            </div>
            <div className="pt-4 border-t border-border">
              <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
              <select
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>INR</option>
                <option>JPY</option>
              </select>
            </div>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">API Keys</h2>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="text-sm text-muted-foreground mb-2">API Key</p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-foreground bg-background px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                sk_live_51234567890abcdefghijklmnop
              </code>
              <button className="px-3 py-1 text-sm border border-border rounded hover:bg-secondary transition-colors">
                Copy
              </button>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            Generate New API Key
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle size={20} className="text-red-600 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
              <p className="text-sm text-red-700 mt-1">Irreversible and destructive actions</p>
            </div>
          </div>
          <Button variant="destructive" className="w-full">
            Delete Account
          </Button>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex gap-3">
          <Button
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-blue-700"
          >
            <Save size={18} />
            Save Changes
          </Button>
          <Button variant="outline">Cancel</Button>
        </div>
      </div>
    </div>
  )
}
