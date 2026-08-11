'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';
import { Save, Server, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const { language } = useLanguage();
  
  const [general, setGeneral] = useState({
    siteName: 'Barav Quiz',
    siteUrl: 'https://baravquiz.com',
    description: 'The ultimate quiz platform for competitive trivia.',
    supportEmail: 'support@baravquiz.com',
    systemVersion: 'v1.0.0',
    workingStatus: 'active', // active, maintenance, offline
  });

  const handleSave = () => {
    toast.success(language === 'ku' ? 'ڕێکخستنەکان بەسەرکەوتوویی پاشەکەوت کران' : 'Settings saved successfully');
  };

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'ڕێکخستنەکان' : 'Settings'}
        description={language === 'ku' ? 'ڕێکخستنی پلاتفۆرمەکە و زانیارییە گشتییەکان' : 'Configure platform-wide settings and preferences'}
        breadcrumbs={[{ label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' }, { label: language === 'ku' ? 'ڕێکخستنەکان' : 'Settings' }]}
      />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="px-6">
            {language === 'ku' ? 'گشتی' : 'General'}
          </TabsTrigger>
          {/* 
            Hidden for future use:
            <TabsTrigger value="features">{language === 'ku' ? 'تایبەتمەندییەکان' : 'Features'}</TabsTrigger>
            <TabsTrigger value="security">{language === 'ku' ? 'ئاسایش' : 'Security'}</TabsTrigger>
            <TabsTrigger value="integrations">{language === 'ku' ? 'بەستەرەکان' : 'Integrations'}</TabsTrigger>
          */}
        </TabsList>

        <TabsContent value="general">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-t-4 border-t-primary shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  {language === 'ku' ? 'ڕێکخستنە گشتییەکان' : 'General Settings'}
                </CardTitle>
                <CardDescription>
                  {language === 'ku' ? 'ڕێکخستنی بنەڕەتی پلاتفۆرمەکە و زانیارییە سەرەکییەکان' : 'Basic platform configuration'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="system-version" className="font-semibold">{language === 'ku' ? 'وەشانی سیستەم (Version)' : 'System Version'}</Label>
                    <Input id="system-version" className="h-11 font-mono" value={general.systemVersion} onChange={(e) => setGeneral({ ...general, systemVersion: e.target.value })} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-semibold">{language === 'ku' ? 'دۆخی کارکردن' : 'Working Status'}</Label>
                    <div className="relative">
                      <Server className="absolute ms-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                      <Select 
                        value={general.workingStatus} 
                        onValueChange={(v) => setGeneral({ ...general, workingStatus: v })}
                      >
                        <SelectTrigger className="h-11 ps-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{language === 'ku' ? 'چالاک (بەردەستە بۆ هەمووان)' : 'Active (Online)'}</SelectItem>
                          <SelectItem value="maintenance">{language === 'ku' ? 'لەژێر چاکسازیدایە (Maintenance)' : 'Under Maintenance'}</SelectItem>
                          <SelectItem value="offline">{language === 'ku' ? 'داخراوە (Offline)' : 'Offline'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4 border-t">
                  <Button size="lg" onClick={handleSave} className="shadow-md">
                    {language === 'ku' ? 'پاشەکەوتکردنی گۆڕانکارییەکان' : 'Save Changes'}
                    <Save className="ms-2 h-4 w-4" />
                  </Button>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

      </Tabs>
    </DashboardShell>
  );
}
