
  import { useState, useEffect } from 'react';
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { useToast } from "@/hooks/use-toast";
  import { supabase } from "@/integrations/supabase/client";
  import { Loader2, Mail, Shield, Zap } from "lucide-react";
  import { Navigation } from "@/components/Navigation";
  import { Dashboard } from "@/components/Dashboard";
  import { Settings } from "@/components/Settings";
  import { Leads } from "@/components/Leads";

  // Define new type to hold customer config
  interface CustomerConfig {
    name: string;
    email: string;
    elevenlabs_api_key: string;
    ghl_api_key: string;
    twilio_sid?: string;
    twilio_token?: string;
    google_calendar: string;
  }

  type AuthStep = 'landing' | 'email' | 'verification' | 'loggedIn' | 'contact';
  type Section = 'dashboard' | 'settings' | 'leads';

  const Index = () => {
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactMessage, setContactMessage] = useState(''); 
    const [currentStep, setCurrentStep] = useState<AuthStep>('landing');
    const [currentSection, setCurrentSection] = useState<Section>('dashboard');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [verificationId, setVerificationId] = useState<string>('');
    const [customerConfig, setCustomerConfig] = useState<CustomerConfig | null>(null);
    const [password, setPassword] = useState('');
    const { toast } = useToast();

    useEffect(() => {
      const fetchCustomerDetails = async () => {
        if (!email) return;

        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (error) {
          console.error('Customer fetch error:', error);
          return;
        }

        setCustomerConfig(data);
      };

      fetchCustomerDetails();
    }, [email]);

    const generateVerificationCode = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const handleEnter = () => {
      setCurrentStep('email');
    };

    const handleEmailSubmit = async () => {
      if (!email || !email.includes('@')) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive"
        });
        return;
      }

      setIsLoading(true);
      try {
        const code = generateVerificationCode();
        
        // Store verification code in database
        const { data, error } = await supabase
          .from('email_verifications')
          .insert({
            email,
            verification_code: code
          })
          .select()
          .single();

        if (error) throw error;

        setVerificationId(data.id);
        
        // Send actual email using the edge function
        const emailResponse = await supabase.functions.invoke('send-verification-email', {
          body: {
            email,
            verificationCode: code
          }
        });

        if (emailResponse.error) {
          console.error('Error sending email:', emailResponse.error);
          toast({
            title: "Email Error",
            description: "Failed to send verification email. Please try again.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Verification Code Sent",
          description: `A verification code has been sent to ${email}. Please check your inbox.`,
        });

        setCurrentStep('verification');
      } catch (error) {
        console.error('Error sending verification:', error);
        toast({
          title: "Error",
          description: "Failed to send verification code. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
const handleLoginSubmit = async () => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setCurrentStep('loggedIn');
  } catch (err) {
    toast({
      title: "Error",
      description: "Something went wrong. Please try again.",
      variant: "destructive"
    });
    console.error(err);
  }
};


    const handleVerificationSubmit = async () => {
      if (!verificationCode || verificationCode.length !== 6) {
        toast({
          title: "Invalid Code",
          description: "Please enter the 6-digit verification code",
          variant: "destructive"
        });
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('email_verifications')
          .select('*')
          .eq('id', verificationId)
          .eq('verification_code', verificationCode)
          .eq('is_verified', false)
          .gte('expires_at', new Date().toISOString())
          .single();

        if (error || !data) {
          // Increment attempts
          await supabase
            .from('email_verifications')
            .update({ attempts: (data?.attempts || 0) + 1 })
            .eq('id', verificationId);

          toast({
            title: "Invalid Code",
            description: "The verification code is incorrect or expired",
            variant: "destructive"
          });
          return;
        }

        // Mark as verified
        await supabase
          .from('email_verifications')
          .update({ is_verified: true })
          .eq('id', verificationId);

        toast({
          title: "Verification Successful",
          description: "Welcome to Citizen AI! Powered by Botsandsites",
        });

        setCurrentStep('loggedIn');
      } catch (error) {
        console.error('Error verifying code:', error);
        toast({
          title: "Error",
          description: "Failed to verify code. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    const renderLandingStep = () => {
      return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          </div>
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>

          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full shadow-2xl animate-pulse">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 animate-fade-in">
                CITIZEN AI
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto mb-8 rounded-full"></div>
            </div>
            
            <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Powered by Bots and Sites. Your personal AI assistant for lead handling, appointment booking, and seamless follow-ups — 24/7.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleEnter}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-4 px-12 text-lg rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 border border-cyan-400/30"
              >
                <Shield className="w-5 h-5 mr-2" />
                ENTER
              </Button>
              
              <Button 
                onClick={() => setCurrentStep('contact')}
                variant="outline"
                className="bg-transparent border-2 border-cyan-400/50 hover:bg-cyan-400/10 text-cyan-400 hover:text-cyan-300 font-semibold py-4 px-12 text-lg rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
              <Mail className="w-5 h-5 mr-2" />
                CONTACT
              </Button>

            </div>
          </div>
        </div>
      );
    };

    const renderEmailStep = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center px-6 space-y-12">
      {/* background grid overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* login - Block 1 */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
      
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-gray-400">Sign in to your account</p>
          </div>

          <div className="space-y-6">
            <Input
              type="email"
              placeholder="your.email@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-700/50 border-cyan-400/30 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
              onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
            />
           <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-700/50 border-cyan-400/30 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
              onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
            />

            <Button
              onClick={handleLoginSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </div>
        </div>
      </div>
<div className="text-white font-semibold text-lg my-4">or</div>
      {/*  email verification block - Block 2 */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Verification</h2>
            <p className="text-gray-400">Enter your email to receive access code</p>
          </div>

          <div className="space-y-6">
            <Input
              type="email"
              placeholder="your.email@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-700/50 border-cyan-400/30 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
              onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
            />

            <Button
              onClick={handleEmailSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

    const renderVerificationStep = () => {
      return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          <div className="relative z-10 w-full max-w-md">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Enter Security Code</h2>
                <p className="text-gray-400">Check your email for the 6-digit code</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-slate-700/50 border-cyan-400/30 text-white text-center text-2xl font-mono tracking-widest placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                    maxLength={6}
                    onKeyPress={(e) => e.key === 'Enter' && handleVerificationSubmit()}
                  />
                </div>
                
                <Button 
                  onClick={handleVerificationSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Enter'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    };

  const renderMainApp = () => {
    return (
      <div className="min-h-screen bg-background">
        <Navigation 
          activeSection={currentSection} 
          onSectionChange={setCurrentSection} 
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentSection === 'dashboard' && <Dashboard customerConfig={customerConfig} />}
          {currentSection === 'settings' && <Settings />}
          {currentSection === 'leads' && <Leads />}
        </main>
      </div>
    );
  };


    const renderContactStep = () => {
    const handleContactSubmit = async () => {
    if (!contactName || !contactEmail || !contactPhone) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: contactName,
          phone: contactPhone,
          email: contactEmail,
          message: contactMessage
        });

      if (error) throw error;

      toast({
        title: "Submitted",
        description: "Thanks for getting in touch! We'll get back to you shortly.",
      });

      // Reset form and go back to landing
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setContactMessage('');
      setCurrentStep('landing');

    } catch (err) {
      console.error('Submission error:', err);
      toast({
        title: "Error",
        description: "Something went wrong while submitting the form.",
        variant: "destructive"
      });
    }
  };


    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Contact Us</h2>

            <div className="space-y-4">
              <Input
                placeholder="Your Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
              <Input
                placeholder="Phone Number"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email Address"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <textarea
                placeholder="Reason for contact..."
                className="w-full px-4 py-3 rounded-md bg-slate-700/50 text-white placeholder:text-gray-400"
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
              ></textarea>

              <Button 
                onClick={handleContactSubmit}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg"
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>  
    );
  };

    switch (currentStep) {
    case 'landing':
      return renderLandingStep();
    case 'email':
      return renderEmailStep();
    case 'verification':
      return renderVerificationStep();
    case 'loggedIn':
      return renderMainApp();
    case 'contact':
      return renderContactStep();
    default:
      return renderLandingStep();
  }
  };

  export default Index;