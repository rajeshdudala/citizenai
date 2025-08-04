import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Clock, User } from 'lucide-react';

export const Leads = () => {
  const [leadSource, setLeadSource] = useState('');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Twilio Phone Number */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Twilio Phone Number
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="phone-number">Issued Phone Number</Label>
            <Input
              id="phone-number"
              value="+1 (555) 123-4567"
              readOnly
              className="bg-muted/50"
            />
            <p className="text-sm text-muted-foreground">
              This is your assigned Twilio phone number for receiving calls.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Call Window Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Call Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="call-window">Preferred Outbound Call Window</Label>
            <Select defaultValue="9am-5pm">
              <SelectTrigger>
                <SelectValue placeholder="Select time window" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9am-5pm">9 AM - 5 PM (Business Hours)</SelectItem>
                <SelectItem value="10am-6pm">10 AM - 6 PM</SelectItem>
                <SelectItem value="8am-4pm">8 AM - 4 PM</SelectItem>
                <SelectItem value="flexible">Flexible (Anytime)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose your preferred time window for making outbound calls.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lead Source */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Lead Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="lead-source">Lead Source</Label>
            <Input
              id="lead-source"
              placeholder="e.g., Google Ads, Facebook, Referral"
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Specify where your leads are coming from for better tracking.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};