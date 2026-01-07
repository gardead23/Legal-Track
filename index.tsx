import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Clock, 
  CreditCard, 
  ChevronRight, 
  Briefcase, 
  User, 
  Lock,
  Search,
  Activity,
  ArrowRight,
  Menu,
  X,
  HelpCircle,
  FileSignature,
  PenTool,
  Upload,
  Eye,
  LogOut,
  Smartphone,
  Sparkles,
  Gavel,
  Scale,
  FileQuestion,
  ScrollText,
  Lightbulb
} from 'lucide-react';

// --- TYPES ---

type Jurisdiction = 'TX' | 'FL' | 'CO' | 'OTHER';

type ServiceId = 
  | 'contract_review' 
  | 'demand_letter' 
  | 'affidavit' 
  | 'deposition_questionnaire' 
  | 'motion' 
  | 'filing_lawsuit' 
  | 'filing_answer' 
  | 'business_formation' 
  | 'attorney_review';

type UserRole = 'guest' | 'client' | 'admin';

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface ServiceTrack {
  id: ServiceId;
  title: string;
  description: string;
  basePrice: number;
  icon: React.ElementType;
  complexity: 'low' | 'medium' | 'high';
}

interface SecureDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  secureUrl: string;
  uploadedAt: string;
}

interface IntakeData {
  jurisdiction: Jurisdiction;
  serviceId: ServiceId | null;
  triageDescription?: string;
  triageReasoning?: string;
  urgency: 'standard' | 'rush';
  details: Record<string, any>;
  documents: SecureDocument[];
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  signature?: {
    signedName: string;
    timestamp: string;
    agreed: boolean;
  };
}

interface Matter {
  id: string;
  status: 'new' | 'reviewing' | 'conflict_flagged' | 'in_progress' | 'completed';
  data: IntakeData;
  createdAt: string;
  price: number;
  auditLog: AuditEvent[];
}

interface AuditEvent {
  timestamp: string;
  action: string;
  details?: string;
}

interface AiRecommendation {
  serviceId: ServiceId;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
}

// --- CONFIG & SERVICES ---

const SERVICES: ServiceTrack[] = [
  {
    id: 'contract_review',
    title: 'Contract Review',
    description: 'Review and written feedback on an existing agreement.',
    basePrice: 250,
    icon: FileText,
    complexity: 'low'
  },
  {
    id: 'demand_letter',
    title: 'Demand Letter',
    description: 'Formal written demand asserting a claim or requesting action.',
    basePrice: 200,
    icon: AlertTriangle,
    complexity: 'low'
  },
  {
    id: 'affidavit',
    title: 'Affidavit',
    description: 'Preparation of a sworn written statement based on facts.',
    basePrice: 150,
    icon: ScrollText,
    complexity: 'low'
  },
  {
    id: 'deposition_questionnaire',
    title: 'Deposition Questionnaire',
    description: 'Drafting written questions for deposition or discovery.',
    basePrice: 350,
    icon: FileQuestion,
    complexity: 'medium'
  },
  {
    id: 'motion',
    title: 'Motion',
    description: 'Preparation of a single legal motion document.',
    basePrice: 500,
    icon: Gavel,
    complexity: 'high'
  },
  {
    id: 'filing_lawsuit',
    title: 'Filing a Lawsuit',
    description: 'Preparation of an initial complaint or petition.',
    basePrice: 800,
    icon: Scale,
    complexity: 'high'
  },
  {
    id: 'filing_answer',
    title: 'Filing an Answer',
    description: 'Formal answer or response to a lawsuit/complaint.',
    basePrice: 600,
    icon: Shield,
    complexity: 'medium'
  },
  {
    id: 'attorney_review',
    title: 'Attorney Assessment & Strategy',
    description: 'A 1-on-1 review of your situation to determine the best legal path. Choose this if your case is complex or doesn\'t fit the standard options.',
    basePrice: 100, 
    icon: User,
    complexity: 'high'
  }
];

class MockBackend {
  private matters: Matter[] = [];
  private conflictBlacklist = ['evil corp', 'bad guy', 'fraud llc'];

  private normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  checkConflict(name: string): boolean {
    if (!name) return false;
    const normalizedInput = this.normalize(name);
    return this.conflictBlacklist.some(entry => 
      normalizedInput.includes(this.normalize(entry))
    );
  }

  createMatter(data: IntakeData, price: number): Matter {
    const isConflict = data.details.opposingParty 
      ? this.checkConflict(data.details.opposingParty) 
      : false;

    const matter: Matter = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      status: isConflict ? 'conflict_flagged' : 'new',
      data,
      price,
      createdAt: new Date().toISOString(),
      auditLog: [
        { timestamp: new Date().toISOString(), action: 'MATTER_CREATED', details: 'Intake submitted' },
        { timestamp: data.signature?.timestamp || new Date().toISOString(), action: 'AGREEMENT_SIGNED', details: `Signed by ${data.signature?.signedName}` }
      ]
    };

    if (isConflict) {
      matter.auditLog.push({ 
        timestamp: new Date().toISOString(), 
        action: 'CONFLICT_DETECTED', 
        details: `Potential match for: ${data.details.opposingParty}` 
      });
    }

    this.matters.push(matter);
    return matter;
  }

  getMatters() {
    return this.matters;
  }
}

const backend = new MockBackend();

// --- COMPONENTS ---

const NavConfirmModal = ({ isOpen, onConfirm, onCancel, targetStepLabel }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="bg-yellow-100 p-2 rounded-full">
            <AlertTriangle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Go back to {targetStepLabel}?</h3>
            <p className="text-slate-600 mt-2 text-sm">
              Going back allows you to edit information, but it may invalidate later data (such as your pricing or signature).
            </p>
            <p className="text-slate-600 mt-2 text-sm font-medium">
              You will need to review and click "Continue" on all subsequent steps to re-validate your file.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            Confirm & Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

const Layout = ({ 
  children, 
  currentView, 
  setView, 
  user,
  onLogout 
}: { 
  children?: React.ReactNode, 
  currentView: string, 
  setView: (v: string) => void,
  user: UserProfile | null,
  onLogout: () => void
}) => (
  <div className="min-h-screen flex flex-col font-sans text-slate-900">
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button 
          onClick={() => setView('home')} 
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-md p-1 group"
          aria-label="SoloScale Legal Home"
        >
          <Shield className="h-8 w-8 text-brand-600 group-hover:text-brand-700" aria-hidden="true" />
          <span className="font-bold text-xl text-slate-900 tracking-tight group-hover:text-slate-800">SoloScale Legal</span>
        </button>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <button onClick={() => setView('home')} className="hidden md:block hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1">Services</button>
          
          {user ? (
            <>
              {user.role === 'admin' ? (
                 <button onClick={() => setView('admin')} className={`hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1 ${currentView === 'admin' ? 'text-brand-600' : ''}`}>Dashboard</button>
              ) : (
                 <button onClick={() => setView('portal')} className={`hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1 ${currentView === 'portal' ? 'text-brand-600' : ''}`}>My Portal</button>
              )}
              
              <div className="h-6 w-px bg-slate-300 mx-2" aria-hidden="true"></div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 hidden sm:inline-block">
                  {user.email} ({user.role})
                </span>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-1 text-slate-500 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                  aria-label="Sign Out"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <>
               <button onClick={() => setView('portal')} className="hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1">Client Portal</button>
               <button onClick={() => setView('admin')} className="text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1">Admin</button>
            </>
          )}
        </nav>
      </div>
    </header>
    <main className="flex-grow bg-slate-50">
      {children}
    </main>
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm mb-4">
          © 2024 SoloScale Legal. Not a law firm. No attorney-client relationship is formed until a written agreement is signed.
        </p>
        <div className="flex justify-center gap-4 text-xs uppercase tracking-wider">
          <button className="hover:text-white focus:outline-none focus:underline">Privacy Policy</button>
          <button className="hover:text-white focus:outline-none focus:underline">Terms of Service</button>
          <button className="hover:text-white focus:outline-none focus:underline">Attorney Advertising</button>
        </div>
      </div>
    </footer>
  </div>
);

const AuthScreen = ({ onLogin }: { onLogin: (user: UserProfile) => void }) => {
  const [step, setStep] = useState<'email' | 'magic_link' | 'password' | 'mfa'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (step === 'email' && emailInputRef.current) emailInputRef.current.focus();
  }, [step]);

  const isAdmin = email.toLowerCase().includes('admin');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      if (isAdmin) {
        setStep('password');
      } else {
        setStep('magic_link');
      }
    }, 800);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (password === 'legal123') {
        setStep('mfa');
      } else {
        setError('Invalid password.');
      }
    }, 800);
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (mfaCode === '123456') {
        onLogin({
          id: 'admin-1',
          email: email,
          role: 'admin',
          name: 'Attorney Admin'
        });
      } else {
        setError('Invalid MFA code.');
      }
    }, 800);
  };

  const handleMagicLinkSimulate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({
        id: 'client-' + Math.floor(Math.random() * 1000),
        email: email,
        role: 'client',
        name: email.split('@')[0]
      });
    }, 1000);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-slate-100">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-brand-600" aria-hidden="true" />
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
            {step === 'email' ? 'Welcome Back' : isAdmin ? 'Attorney Access' : 'Check your inbox'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {step === 'email' && 'Enter your email to sign in to your portal.'}
            {step === 'magic_link' && `We sent a magic link to ${email}.`}
            {step === 'password' && 'Please enter your password.'}
            {step === 'mfa' && 'Enter the 6-digit code from your authenticator app.'}
          </p>
        </div>

        {step === 'email' && (
          <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  ref={emailInputRef}
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-70 transition-colors"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
             <label htmlFor="password" className="sr-only">Password</label>
             <input
                id="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p className="text-red-600 text-sm text-center" role="alert">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                {loading ? 'Verifying...' : 'Verify Password'}
              </button>
              <div className="text-center text-xs text-slate-500 mt-2">Hint: legal123</div>
          </form>
        )}

        {step === 'mfa' && (
          <form className="mt-8 space-y-6" onSubmit={handleMfaSubmit}>
             <div className="flex justify-center mb-4">
                <Smartphone className="h-16 w-16 text-slate-200" aria-hidden="true" />
             </div>
             <label htmlFor="mfa-code" className="sr-only">MFA Code</label>
             <input
                id="mfa-code"
                type="text"
                maxLength={6}
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 text-center tracking-widest text-2xl focus:outline-none focus:ring-brand-500 focus:border-brand-500 bg-white"
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                autoFocus
              />
              {error && <p className="text-red-600 text-sm text-center" role="alert">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              >
                {loading ? 'Authenticating...' : 'Verify Code'}
              </button>
              <div className="text-center text-xs text-slate-500 mt-2">Hint: 123456</div>
          </form>
        )}

        {step === 'magic_link' && (
          <div className="mt-8 text-center space-y-6">
            <div className="bg-green-50 p-4 rounded-lg text-green-800 text-sm border border-green-200" role="status">
              We've sent a temporary login link to <strong>{email}</strong>.
            </div>
            <div className="border-t border-slate-100 pt-6">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-4">Developer Mode</p>
              <button
                onClick={handleMagicLinkSimulate}
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-dashed border-brand-300 text-sm font-medium rounded-md text-brand-700 bg-brand-50 hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              >
                {loading ? 'Logging in...' : 'Simulate Clicking Link'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Hero = ({ onStart }: { onStart: () => void }) => (
  <div className="bg-white">
    <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 text-center">
      <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
        Legal services, <span className="text-brand-600">productized.</span>
      </h1>
      <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
        Transparent flat fees. Fast turnarounds. Licensed in TX, FL, and CO. 
        Start your intake in minutes without the hourly billing surprise.
      </p>
      <button 
        onClick={onStart}
        className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
      >
        Start Intake
        <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
      </button>
      
      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
        {[
          { icon: Clock, title: "Fast Turnaround", desc: "Rush options available for 24h delivery." },
          { icon: Lock, title: "Secure Portal", desc: "Bank-grade encryption for your documents." },
          { icon: CheckCircle, title: "Attorney Reviewed", desc: "Every deliverable is reviewed by a human." }
        ].map((feat, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-brand-100 text-brand-700 mb-4">
              <feat.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">{feat.title}</h3>
            <p className="mt-2 text-base text-slate-500">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const WizardStep = ({ title, children }: { title: string, children?: React.ReactNode }) => (
  <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100">
    <div className="px-8 py-6 border-b border-slate-100">
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    </div>
    <div className="p-8">
      {children}
    </div>
  </div>
);

const JurisdictionGate = ({ onSelect }: { onSelect: (j: Jurisdiction) => void }) => {
  return (
    <WizardStep title="First, let's check eligibility">
      <p className="text-slate-600 mb-6">
        We are currently licensed to practice law in specific states. Where is your legal issue located?
      </p>
      <div className="grid grid-cols-1 gap-4">
        {['Texas (TX)', 'Florida (FL)', 'Colorado (CO)'].map((label) => (
          <button
            key={label}
            onClick={() => onSelect(label.includes('TX') ? 'TX' : label.includes('FL') ? 'FL' : 'CO')}
            className="flex items-center justify-between p-4 border rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-all text-left group focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <span className="font-medium text-slate-900 group-hover:text-brand-700">{label}</span>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-brand-500" aria-hidden="true" />
          </button>
        ))}
        <button
          onClick={() => onSelect('OTHER')}
          className="flex items-center justify-between p-4 border rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all text-left focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <span className="font-medium text-slate-600">Other State</span>
          <ChevronRight className="h-5 w-5 text-slate-300" aria-hidden="true" />
        </button>
      </div>
    </WizardStep>
  );
};

const TriageAssistant = ({ onResult, onSkip, currentInput }: { onResult: (recommendation: AiRecommendation | null, description: string) => void, onSkip: () => void, currentInput: string }) => {
  const [input, setInput] = useState(currentInput || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `
        You are a legal intake triage assistant.
        Your task is to classify the user's issue into one of these EXACT services:
        1. contract_review
        2. demand_letter
        3. affidavit
        4. deposition_questionnaire
        5. motion
        6. filing_lawsuit
        7. filing_answer

        If the issue is ambiguous, describes a criminal matter, family law (divorce/custody), immigration, estate planning, employment dispute, personal injury, appeals, or complex litigation not fitting the above, you MUST classify it as 'attorney_review'.

        Strict Rules:
        - Do NOT provide legal advice.
        - Recommend EXACTLY ONE service that is the best fit.
        
        Output Rules for 'reasoning':
        - Tone: Friendly, confident, professional, and non-technical.
        - Speak directly to the user (e.g., "We recommend this because...").
        - Do NOT mention internal IDs (like 'attorney_review' or 'contract_review') or technical terms like "defined services".
        - If classifying as 'attorney_review', explain that the situation appears specific or complex, so a human expert review is the best first step.
        - Keep it to 1-2 clear sentences.

        User Input: "${input}"
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              serviceId: { type: Type.STRING },
              confidence: { type: Type.STRING },
              reasoning: { type: Type.STRING },
            },
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      if (result.serviceId) {
        onResult({
          serviceId: result.serviceId,
          confidence: result.confidence,
          reasoning: result.reasoning
        }, input);
      } else {
        onResult(null, input);
      }
    } catch (e) {
      console.error("AI Triage Failed", e);
      onResult(null, input);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <WizardStep title="Tell us about your legal issue">
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-lg flex gap-3 items-start border border-slate-100">
           <Sparkles className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
           <p className="text-sm text-slate-600">
             We will analyze your situation and recommend the correct service track. Please include what happened, who is involved, and what outcome you want.
             <span className="block mt-1 italic text-xs text-slate-500">Example: "I need to sue a contractor who took my money but didn't finish the roof."</span>
           </p>
        </div>

        <div>
          <label htmlFor="issue-description" className="sr-only">Description of your legal issue</label>
          <textarea
            id="issue-description"
            rows={5}
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-900 border-slate-300 bg-white"
            placeholder="What's happening?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-2">Please do not include sensitive financial account numbers yet.</p>
        </div>

        <button 
          onClick={handleAnalyze}
          disabled={!input.trim() || isAnalyzing}
          aria-live="polite"
          className="w-full bg-brand-600 text-white py-3 rounded-md font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
        >
          {isAnalyzing ? (
            <>
              <Activity className="h-4 w-4 animate-spin" aria-hidden="true" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze & Recommend
            </>
          )}
        </button>

        <div className="text-center">
          <button onClick={onSkip} className="text-sm text-slate-500 hover:text-slate-700 underline focus:outline-none focus:ring-2 focus:ring-slate-500 rounded px-2">
            Choose services manually
          </button>
        </div>
      </div>
    </WizardStep>
  );
};

const ServiceRecommendation = ({ recommendation, onConfirm, onShowCatalog }: { recommendation: AiRecommendation, onConfirm: () => void, onShowCatalog: () => void }) => {
  const service = SERVICES.find(s => s.id === recommendation.serviceId);
  if (!service) return null;

  return (
    <WizardStep title="Based on your description, we recommend:">
      <div className="flex flex-col items-center text-center">
        <div className="w-full max-w-md bg-white border-2 border-brand-100 rounded-xl p-6 shadow-sm mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>
          <div className="flex justify-center mb-4">
             <div className="p-3 bg-brand-50 rounded-full">
               <service.icon className="h-8 w-8 text-brand-600" aria-hidden="true" />
             </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
          <p className="text-sm text-slate-600 mb-4">{recommendation.reasoning}</p>
          <div className="bg-slate-50 rounded-lg p-3 mb-4">
             <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Estimated Base Price</p>
             <p className="text-lg font-bold text-slate-900">${service.basePrice}</p>
          </div>
          <button 
            onClick={onConfirm}
            className="w-full bg-brand-600 text-white py-3 rounded-md font-medium hover:bg-brand-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
          >
            Continue with {service.title}
          </button>
        </div>

        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
          This recommendation is for informational purposes and does not constitute legal counsel. You are responsible for selecting the service that fits your needs.
        </p>

        <button 
          onClick={onShowCatalog}
          className="text-slate-600 font-medium hover:text-brand-700 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2"
        >
          No, show me all services
        </button>
      </div>
    </WizardStep>
  );
};

const ServiceCatalog = ({ onSelect, recommendation, selectedId }: { onSelect: (s: ServiceId) => void, recommendation?: AiRecommendation | null, selectedId: ServiceId | null }) => (
  <WizardStep title="Service Catalog">
    <p className="text-slate-600 mb-6">Please select the <strong className="text-slate-800">primary</strong> service you need right now. You can request additional services later.</p>
    <div className="grid grid-cols-1 gap-4">
      {SERVICES.map((service) => {
        const isRecommended = recommendation?.serviceId === service.id;
        const isSelected = selectedId === service.id;
        const isAssessment = service.id === 'attorney_review';

        return (
          <button
            key={service.id}
            onClick={() => onSelect(service.id)}
            className={`flex items-start p-4 border rounded-lg transition-all text-left group relative focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              isSelected 
                ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' 
                : isAssessment 
                  ? 'border-slate-300 bg-slate-50 hover:border-slate-400' 
                  : 'hover:border-brand-400 hover:bg-slate-50 border-slate-200'
            } ${isAssessment ? 'mt-4' : ''}`}
          >
            {isRecommended && (
              <span className="absolute -top-3 left-4 bg-brand-600 text-white text-xs px-2 py-1 rounded shadow-sm flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Recommended based on your input
              </span>
            )}
            
            <div className="flex items-center h-full pt-1">
               <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-4 ${isSelected ? 'border-brand-600' : 'border-slate-400'}`}>
                  {isSelected && <div className="h-2 w-2 rounded-full bg-brand-600" />}
               </div>
            </div>

            <div className="flex-shrink-0 mt-1">
              <service.icon className={`h-6 w-6 ${isSelected ? 'text-brand-700' : 'text-slate-400 group-hover:text-brand-600'}`} aria-hidden="true" />
            </div>
            <div className="ml-4 w-full">
              <div className="flex justify-between items-center">
                 <h3 className={`text-lg font-medium ${isSelected ? 'text-brand-900' : 'text-slate-900'}`}>{service.title}</h3>
                 {!isAssessment && <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:inline-block">{service.complexity} complexity</span>}
              </div>
              <p className="mt-1 text-sm text-slate-600 pr-8">{service.description}</p>
              <p className="mt-2 text-sm font-semibold text-brand-700">Starts at ${service.basePrice}</p>
            </div>
          </button>
        )
      })}
    </div>
  </WizardStep>
);

const DetailsForm = ({ serviceId, data, documents, onChange, onNext }: any) => {
  const service = SERVICES.find(s => s.id === serviceId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const doc: SecureDocument = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          secureUrl: event.target?.result as string, 
          uploadedAt: new Date().toISOString()
        };
        const currentDocs = documents || [];
        onChange('documents', [...currentDocs, doc]);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderUpload = (label: string = "Upload Relevant Documents") => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-1" id="file-upload-label">{label}</label>
      
      {(!documents || documents.length === 0) ? (
         <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 bg-white">
          <input 
            type="file" 
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" 
            onChange={handleFileUpload} 
            accept=".pdf,.docx,.doc,.jpg,.png" 
            aria-labelledby="file-upload-label"
          />
          <div className="pointer-events-none">
            <Upload className="mx-auto h-8 w-8 text-brand-600 mb-2" aria-hidden="true" />
            <span className="block text-sm font-medium text-slate-700">Click or drag to upload file</span>
            <span className="block text-xs text-slate-500 mt-1">PDF, DOCX up to 25MB</span>
            <span className="block text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" aria-hidden="true" /> Encrypted Storage
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc: SecureDocument) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-3">
                 <FileText className="h-5 w-5 text-green-700" aria-hidden="true" />
                 <div>
                    <p className="text-sm font-medium text-green-800">{doc.name}</p>
                    <p className="text-xs text-green-700">{(doc.size / 1024).toFixed(1)} KB • Securely Uploaded</p>
                 </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-700" aria-hidden="true" />
            </div>
          ))}
          <button 
            onClick={() => onChange('documents', [])}
            className="text-xs text-red-700 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1"
          >
            Remove and upload different file
          </button>
        </div>
      )}
    </div>
  );

  return (
    <WizardStep title={`Tell us about your ${service?.title}`}>
      <div className="space-y-6">
        
        {serviceId === 'contract_review' && (
          <>
            {renderUpload("Upload the Contract for Review")}
            <div>
              <label htmlFor="pageCount" className="block text-sm font-medium text-slate-700 mb-1">Page Count</label>
              <input 
                id="pageCount"
                type="number" 
                min="1"
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none border-slate-300 bg-white text-slate-900 placeholder-slate-500"
                placeholder="e.g. 5"
                value={data.pageCount || ''}
                onChange={(e) => onChange('pageCount', parseInt(e.target.value))}
              />
              <p className="text-xs text-slate-500 mt-1">Pricing adjusts based on length.</p>
            </div>
          </>
        )}

        {serviceId === 'demand_letter' && (
          <>
            {renderUpload("Upload Supporting Evidence (Optional)")}
            <div>
              <label htmlFor="opposingParty" className="block text-sm font-medium text-slate-700 mb-1">Opposing Party Name</label>
              <input 
                id="opposingParty"
                type="text" 
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none border-slate-300 bg-white text-slate-900 placeholder-slate-500"
                placeholder="Who receives this letter?"
                value={data.opposingParty || ''}
                onChange={(e) => onChange('opposingParty', e.target.value)}
              />
            </div>
            <div>
               <label htmlFor="amountDispute" className="block text-sm font-medium text-slate-700 mb-1">Amount in Dispute ($)</label>
               <input 
                 id="amountDispute"
                 type="number"
                 className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none border-slate-300 bg-white text-slate-900 placeholder-slate-500"
                 value={data.amountDispute || ''}
                 onChange={(e) => onChange('amountDispute', e.target.value)}
               />
            </div>
          </>
        )}

        {['affidavit', 'motion', 'filing_lawsuit', 'filing_answer', 'deposition_questionnaire', 'attorney_review'].includes(serviceId) && (
           <>
             {renderUpload("Relevant Documents / Court Filings")}
             
             {serviceId !== 'affidavit' && (
               <div>
                  <label htmlFor="caseNumber" className="block text-sm font-medium text-slate-700 mb-1">Case Number (If applicable)</label>
                  <input 
                    id="caseNumber"
                    type="text"
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none border-slate-300 bg-white text-slate-900 placeholder-slate-500"
                    placeholder="e.g. CV-2023-0001"
                    value={data.caseNumber || ''}
                    onChange={(e) => onChange('caseNumber', e.target.value)}
                  />
               </div>
             )}

             <div>
                <label htmlFor="opposingParty" className="block text-sm font-medium text-slate-700 mb-1">Opposing Party / Relevant Entities</label>
                <input 
                  id="opposingParty"
                  type="text" 
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none border-slate-300 bg-white text-slate-900 placeholder-slate-500"
                  placeholder="Names of other parties involved"
                  value={data.opposingParty || ''}
                  onChange={(e) => onChange('opposingParty', e.target.value)}
                />
             </div>
           </>
        )}

        <div>
          <label htmlFor="fact-summary" className="block text-sm font-medium text-slate-700 mb-1">Specific Instructions / Facts</label>
          <textarea 
            id="fact-summary"
            rows={6}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none border-slate-300 bg-white text-slate-900 placeholder-slate-500"
            placeholder="Please provide a detailed summary of the facts and your goals..."
            value={data.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
          />
        </div>

        <button 
          onClick={onNext}
          disabled={!data.description} 
          className="w-full bg-brand-600 text-white py-3 rounded-md font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
        >
          Continue
        </button>
      </div>
    </WizardStep>
  );
};

const ContactForm = ({ contact, onChange, onNext }: any) => {
  const [confirmEmail, setConfirmEmail] = useState(contact.email || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => phone.replace(/[^\d]/g, '').length === 10;

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange('email', val);
    
    // Clear mismatch error on confirm field if it now matches
    if (confirmEmail && val === confirmEmail) {
       setErrors(prev => ({ ...prev, confirmEmail: '' }));
    } else if (confirmEmail && val !== confirmEmail) {
       // Only show mismatch error if confirm email field is actively being used
       setErrors(prev => ({ ...prev, confirmEmail: 'Email addresses don\'t match.' }));
    }

    if (touched.email) {
      setErrors(prev => ({
        ...prev, 
        email: validateEmail(val) ? '' : 'Please enter a valid email address.'
      }));
    }
  };

  const handleConfirmEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfirmEmail(val);
    if (touched.confirmEmail || val.length > 0) {
      setErrors(prev => ({
        ...prev, 
        confirmEmail: val === contact.email ? '' : 'Email addresses don\'t match.'
      }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange('phone', formatted);
    if (touched.phone) {
       setErrors(prev => ({
         ...prev, 
         phone: validatePhone(formatted) ? '' : 'Please enter a valid 10-digit U.S. phone number.'
       }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setErrors(prev => ({
        ...prev, 
        email: validateEmail(contact.email) ? '' : 'Please enter a valid email address.'
      }));
    }
    if (field === 'confirmEmail') {
      setErrors(prev => ({
        ...prev, 
        confirmEmail: confirmEmail === contact.email ? '' : 'Email addresses don\'t match.'
      }));
    }
    if (field === 'phone') {
       setErrors(prev => ({
         ...prev, 
         phone: validatePhone(contact.phone) ? '' : 'Please enter a valid 10-digit U.S. phone number.'
       }));
    }
  };

  const isComplete = 
    contact.name && 
    contact.email && 
    confirmEmail &&
    contact.phone &&
    !errors.email && 
    !errors.confirmEmail && 
    !errors.phone &&
    validateEmail(contact.email) &&
    confirmEmail === contact.email &&
    validatePhone(contact.phone);

  return (
    <WizardStep title="Your Contact Information">
      <div className="space-y-5">
        <div>
          <label htmlFor="full-name" className="block text-sm font-medium text-slate-700 mb-1">Full Legal Name</label>
          <input 
            id="full-name"
            type="text" 
            placeholder="Jane Doe" 
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none border-slate-300 bg-white"
            value={contact.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1">This name will appear on your engagement letter.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              id="email"
              type="email" 
              placeholder="jane@example.com" 
              className={`w-full p-3 border rounded-md focus:ring-2 focus:outline-none bg-white ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-brand-500'}`}
              value={contact.email}
              onChange={handleEmailChange}
              onBlur={() => handleBlur('email')}
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="confirm-email" className="block text-sm font-medium text-slate-700 mb-1">Confirm Email Address</label>
            <input 
              id="confirm-email"
              type="email" 
              placeholder="jane@example.com" 
              className={`w-full p-3 border rounded-md focus:ring-2 focus:outline-none bg-white ${errors.confirmEmail ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-brand-500'}`}
              value={confirmEmail}
              onChange={handleConfirmEmailChange}
              onBlur={() => handleBlur('confirmEmail')}
            />
             {errors.confirmEmail && <p className="text-xs text-red-600 mt-1">{errors.confirmEmail}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
          <input 
            id="phone"
            type="tel" 
            placeholder="(555) 123-4567" 
            className={`w-full p-3 border rounded-md focus:ring-2 focus:outline-none bg-white ${errors.phone ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-brand-500'}`}
            value={contact.phone}
            onChange={handlePhoneChange}
            onBlur={() => handleBlur('phone')}
          />
          {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
          <p className="text-xs text-slate-500 mt-1">Used only for case-related communication.</p>
        </div>

        <div className="pt-2">
          <button 
            onClick={onNext}
            disabled={!isComplete}
            className="w-full bg-brand-600 text-white py-3 rounded-md font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          >
            Review Agreement
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">
             You’ll be able to review and edit this information before submitting.
          </p>
        </div>
      </div>
    </WizardStep>
  );
};

const EngagementLetter = ({ data, onSign, onEdit }: { data: IntakeData, onSign: () => void, onEdit: () => void }) => {
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState('');
  const [date] = useState(new Date().toLocaleDateString());
  
  const service = SERVICES.find(s => s.id === data.serviceId);
  
  // Calculate estimated display price (base + complexity only, rush is calculated in next step)
  let displayPrice = service?.basePrice || 0;
  if (data.serviceId === 'contract_review' && data.details.pageCount > 10) {
    displayPrice += (data.details.pageCount - 10) * 10;
  }
  if (data.serviceId === 'filing_lawsuit') {
    displayPrice += 200;
  }

  const canSign = agreed && signature.toLowerCase().trim() === data.contact.name.toLowerCase().trim();

  return (
    <WizardStep title="Review & Sign">
      
      {/* 1. Service Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-8 flex flex-col sm:flex-row gap-4 items-start">
         <div className="p-3 bg-white border border-slate-200 rounded-md shadow-sm">
            {service?.icon && React.createElement(service.icon, { className: "h-6 w-6 text-brand-600" })}
         </div>
         <div className="flex-grow">
            <h3 className="font-bold text-slate-900 text-lg">{service?.title}</h3>
            <p className="text-slate-600 text-sm mt-1">{service?.description}</p>
         </div>
         <div className="flex-shrink-0 text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Est. Total</p>
            <p className="text-xl font-bold text-slate-900">${displayPrice}</p>
         </div>
      </div>

      {/* 2. Contact Information Summary */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                Contact Information
            </h3>
            <button 
                onClick={onEdit}
                className="text-xs font-medium text-brand-600 hover:text-brand-800 hover:underline flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-1"
            >
                <PenTool className="h-3 w-3" /> Edit
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
                <p className="text-xs text-slate-500 mb-1">Full Legal Name</p>
                <p className="font-medium text-slate-900">{data.contact.name}</p>
            </div>
            <div>
                <p className="text-xs text-slate-500 mb-1">Email Address</p>
                <p className="font-medium text-slate-900">{data.contact.email}</p>
            </div>
            <div>
                <p className="text-xs text-slate-500 mb-1">Phone Number</p>
                <p className="font-medium text-slate-900">{data.contact.phone}</p>
            </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Agreement Terms</h3>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 h-64 overflow-y-auto mb-6 text-sm text-slate-700 font-mono leading-relaxed shadow-inner" tabIndex={0} aria-label="Engagement Letter Text">
          <p className="font-bold mb-4 text-center">LIMITED SCOPE ENGAGEMENT LETTER</p>
          <p className="mb-4">
            <strong>1. PARTIES.</strong> This Agreement is made between SoloScale Legal ("Attorney") and 
            <span className="bg-yellow-100 px-1 mx-1 font-bold">{data.contact.name}</span> ("Client") 
            on {date}.
          </p>
          <p className="mb-4">
            <strong>2. SCOPE OF SERVICE.</strong> Attorney agrees to provide the following limited legal services: 
            <span className="font-bold"> {service?.title}</span>. This representation is limited to this specific task and does not include litigation, appeals, or ongoing advice unless explicitly agreed upon in a new writing.
          </p>
          <p className="mb-4">
            <strong>3. FEES.</strong> Client agrees to pay a flat fee starting at ${displayPrice} (subject to complexity adjustments confirmed at checkout). Fees are earned upon receipt but held subject to refund if a conflict of interest is discovered.
          </p>
          <p className="mb-4">
            <strong>4. NO GUARANTEE.</strong> Attorney cannot guarantee the outcome of any legal matter.
          </p>
          <p className="mb-4">
            <strong>5. TERMINATION.</strong> Client may terminate this agreement at any time. Attorney may withdraw for ethical reasons or non-payment.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-slate-50 border-slate-200 transition-colors">
          <input 
            type="checkbox" 
            checked={agreed} 
            onChange={(e) => setAgreed(e.target.checked)} 
            className="mt-1 h-5 w-5 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
          />
          <span className="text-sm text-slate-700">
            I have read and agree to the terms of the Limited Scope Representation Agreement above. I understand that no attorney-client relationship exists until this agreement is signed and payment is processed.
          </span>
        </label>

        <div>
          <label htmlFor="signature" className="block text-sm font-medium text-slate-700 mb-1">
            Digital Signature
          </label>
          <div className="relative">
            <input 
              id="signature"
              type="text" 
              placeholder={`Type "${data.contact.name}" to sign`}
              className="w-full p-3 pl-10 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none font-serif italic text-lg border-slate-300 bg-white"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
            <FileSignature className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            By typing your name, you are signing this agreement electronically pursuant to the ESIGN Act.
          </p>
        </div>

        <button 
          onClick={onSign}
          disabled={!canSign}
          className="w-full bg-slate-900 text-white py-3 rounded-md font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors shadow-sm"
        >
          <PenTool className="h-4 w-4" aria-hidden="true" />
          Sign & Continue to Payment
        </button>
      </div>
    </WizardStep>
  );
};

const PaymentGateway = ({ serviceId, data, urgency, setUrgency, onCheckout }: any) => {
  const service = SERVICES.find(s => s.id === serviceId);
  
  const priceBreakdown = useMemo(() => {
    let base = service?.basePrice || 0;
    let complexity = 0;
    let rush = 0;

    if (serviceId === 'contract_review' && data.details.pageCount > 10) {
      complexity = (data.details.pageCount - 10) * 10;
    }
    if (serviceId === 'filing_lawsuit') {
      complexity = 200; 
    }

    const subtotal = base + complexity;
    if (urgency === 'rush') {
      rush = subtotal * 0.5;
    }

    return { base, complexity, rush, total: subtotal + rush };
  }, [serviceId, data, urgency]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <div className="lg:col-span-2 space-y-6">
        <WizardStep title="Select Turnaround Time">
          <div className="space-y-4">
            <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${urgency === 'standard' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'hover:border-slate-300 border-slate-200'}`}>
              <div className="flex items-center">
                <input 
                  type="radio" 
                  name="urgency" 
                  checked={urgency === 'standard'} 
                  onChange={() => setUrgency('standard')}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300"
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-slate-900">Standard Delivery</span>
                  <span className="block text-sm text-slate-500">3-5 Business Days</span>
                </div>
              </div>
              <span className="text-sm font-medium text-slate-900">Included</span>
            </label>

            <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${urgency === 'rush' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'hover:border-slate-300 border-slate-200'}`}>
              <div className="flex items-center">
                <input 
                  type="radio" 
                  name="urgency" 
                  checked={urgency === 'rush'} 
                  onChange={() => setUrgency('rush')}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300"
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-slate-900">Priority Rush</span>
                  <span className="block text-sm text-slate-500">Guaranteed 24h Turnaround</span>
                </div>
              </div>
              <span className="text-sm font-medium text-brand-600">+50% Fee</span>
            </label>
          </div>
        </WizardStep>

        <WizardStep title="Secure Payment">
           <div className="space-y-4">
             <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" aria-hidden="true" />
                <div>
                   <p className="text-sm font-bold text-green-800">Agreement Signed</p>
                   <p className="text-xs text-green-700">Signed by {data.signature?.signedName} on {new Date(data.signature?.timestamp).toLocaleDateString()}</p>
                </div>
             </div>

             <div className="mt-4 pt-4 border-t border-slate-100">
               <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 bg-yellow-50 p-3 rounded-md border border-yellow-100">
                 <Lock className="h-4 w-4" aria-hidden="true" />
                 Funds will be authorized now but only captured after attorney conflict check.
               </div>
               <div className="p-4 border rounded-md bg-slate-50 flex items-center gap-3 border-slate-200">
                  <CreditCard className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  <span className="text-slate-500 font-mono">**** **** **** 4242</span>
               </div>
             </div>
           </div>
        </WizardStep>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sticky top-24">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>{service?.title}</span>
              <span>${priceBreakdown.base}</span>
            </div>
            {priceBreakdown.complexity > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Complexity Add-on</span>
                <span>+${priceBreakdown.complexity}</span>
              </div>
            )}
            {priceBreakdown.rush > 0 && (
              <div className="flex justify-between text-brand-600 font-medium">
                <span>Rush Fee</span>
                <span>+${priceBreakdown.rush}</span>
              </div>
            )}
            <div className="pt-3 border-t border-slate-100 flex justify-between text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>${priceBreakdown.total}</span>
            </div>
          </div>
          <button 
            onClick={() => onCheckout(priceBreakdown.total)}
            className="w-full mt-6 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            Authorize Payment
          </button>
        </div>
      </div>
    </div>
  );
};

const SuccessPage = ({ onGoToPortal }: { onGoToPortal: () => void }) => (
  <div className="max-w-2xl mx-auto text-center pt-10">
    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
      <CheckCircle className="h-10 w-10 text-green-600" aria-hidden="true" />
    </div>
    <h2 className="text-3xl font-bold text-slate-900 mb-4">Intake Received</h2>
    <p className="text-lg text-slate-600 mb-8">
      We have received your payment authorization and signed agreement. Your attorney is reviewing the file now.
    </p>
    
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 text-left p-6 mb-8">
      <h3 className="font-bold text-slate-900 mb-4">What happens next?</h3>
      <ol className="space-y-4">
        {[
          "Conflict check initiated (Automated + Manual Review)",
          "Attorney reviews your uploaded documents",
          "You will receive a secure message if we need clarification",
          "Draft deliverables will be uploaded to your portal"
        ].map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">{i+1}</span>
            <span className="text-slate-600">{step}</span>
          </li>
        ))}
      </ol>
    </div>

    <button 
      onClick={onGoToPortal}
      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-brand-700 bg-brand-100 hover:bg-brand-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
    >
      Go to Client Portal
    </button>
  </div>
);

const SecureDocViewer = ({ doc, onClose }: { doc: SecureDocument, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-brand-100 rounded-md">
                <FileText className="h-5 w-5 text-brand-700" aria-hidden="true" />
             </div>
             <div>
               <h3 className="font-bold text-slate-900" id="modal-title">{doc.name}</h3>
               <p className="text-xs text-slate-500">SECURE VIEWER • READ ONLY</p>
             </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500" aria-label="Close viewer">
             <X className="h-6 w-6 text-slate-500" aria-hidden="true" />
           </button>
        </div>
        
        <div className="flex-grow bg-slate-200 relative overflow-y-auto flex items-center justify-center p-8">
           <div className="absolute inset-0 pointer-events-none z-10 flex flex-wrap content-start justify-start opacity-10 select-none overflow-hidden" aria-hidden="true">
             {Array.from({ length: 40 }).map((_, i) => (
               <div key={i} className="text-slate-900 font-bold text-xl rotate-[-30deg] p-12 whitespace-nowrap">
                  CONFIDENTIAL // ATTORNEY EYES ONLY
               </div>
             ))}
           </div>
           
           <div className="bg-white shadow-lg max-w-full z-0 relative">
              {doc.type.includes('image') ? (
                <img src={doc.secureUrl} alt="Secure Preview" className="max-w-full max-h-[70vh] object-contain" />
              ) : (
                <div className="w-[600px] h-[700px] flex flex-col items-center justify-center p-12 text-slate-400 border border-slate-300">
                   <FileText className="h-24 w-24 mb-4" aria-hidden="true" />
                   <p className="text-lg font-medium text-slate-900">Preview not available for {doc.type}</p>
                   <p className="text-sm">In production, this would render via PDF.js</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const [matters, setMatters] = useState(backend.getMatters());
  const [viewingDoc, setViewingDoc] = useState<SecureDocument | null>(null);

  if (!isAuthenticated) return null;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Attorney Dashboard</h2>
          <div className="flex gap-2">
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              {matters.filter(m => m.status === 'conflict_flagged').length} Conflicts
            </span>
            <span className="bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-sm font-medium">
              {matters.filter(m => m.status === 'new').length} New
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {matters.length === 0 && <p className="text-slate-500 italic">No active matters.</p>}
            {matters.map((matter) => (
              <div key={matter.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{matter.data.serviceId?.replace(/_/g, ' ').toUpperCase()}</h3>
                    <p className="text-sm text-slate-500">Submitted: {new Date(matter.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                      matter.status === 'conflict_flagged' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {matter.status.replace('_', ' ')}
                    </span>
                    {matter.data.urgency === 'rush' && (
                      <span className="text-xs font-bold text-orange-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" aria-hidden="true" /> RUSH
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 mb-4">
                  <p><strong>Client:</strong> {matter.data.contact.name} <span className="text-slate-500 text-xs">({matter.data.contact.email})</span></p>
                  {matter.data.details.opposingParty && (
                    <p className={backend.checkConflict(matter.data.details.opposingParty) ? "text-red-700 font-bold" : ""}>
                      <strong>Opposing:</strong> {matter.data.details.opposingParty} 
                      {backend.checkConflict(matter.data.details.opposingParty) && " (MATCH FOUND)"}
                    </p>
                  )}
                  {matter.data.triageReasoning && (
                    <p className="mt-2 text-xs italic text-slate-500 border-t border-slate-200 pt-2">
                      <span className="font-bold">AI Triage:</span> {matter.data.triageReasoning}
                    </p>
                  )}
                </div>

                {matter.data.documents && matter.data.documents.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Secure Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {matter.data.documents.map((doc, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setViewingDoc(doc)}
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded hover:border-brand-500 hover:text-brand-600 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          {doc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
            <h3 className="font-bold text-slate-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Revenue (Simulated)</span>
                <span className="font-mono font-bold text-green-700">
                  ${matters.reduce((acc, m) => acc + m.price, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Avg. Turnaround</span>
                <span className="font-mono font-bold text-slate-900">2.4 Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewingDoc && <SecureDocViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />}
    </>
  );
};

const ClientPortal = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
    <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Matters</h2>
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-slate-200">
        {[
           { id: 'M-1024', title: 'Contract Review - SAAS Agreement', status: 'Reviewing', date: 'Oct 24, 2023' }
        ].map((matter) => (
          <li key={matter.id}>
            <div className="px-4 py-4 sm:px-6 hover:bg-slate-50 transition flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-brand-700 truncate">{matter.title}</div>
                <div className="flex items-center mt-1">
                  <p className="text-sm text-slate-500 mr-4">ID: {matter.id}</p>
                  <p className="text-sm text-slate-500">{matter.date}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  {matter.status}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const STEPS = [
  { label: 'Jurisdiction', id: 0 },
  { label: 'Triage', id: 1 },
  { label: 'Service', id: 2 },
  { label: 'Details', id: 3 },
  { label: 'Contact', id: 4 },
  { label: 'Review', id: 5 },
  { label: 'Pay', id: 6 },
];

const App = () => {
  const [view, setView] = useState('home');
  const [intakeStep, setIntakeStep] = useState(0);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Revised state for recommendations
  const [aiRecommendation, setAiRecommendation] = useState<AiRecommendation | null>(null);
  const [showFullCatalog, setShowFullCatalog] = useState(false);
  
  const [navTarget, setNavTarget] = useState<number | null>(null);
  
  const [intakeData, setIntakeData] = useState<IntakeData>({
    jurisdiction: 'TX',
    serviceId: null,
    urgency: 'standard',
    details: {},
    documents: [],
    contact: { name: '', email: '', phone: '' }
  });

  const startIntake = () => {
    setView('intake');
    setIntakeStep(0);
    setAiRecommendation(null);
    setShowFullCatalog(false);
    setIntakeData({
        jurisdiction: 'TX',
        serviceId: null,
        urgency: 'standard',
        details: {},
        documents: [],
        contact: { name: '', email: '', phone: '' }
    });
  };

  const updateIntake = (field: string, value: any) => {
    if (field === 'serviceId' || field === 'jurisdiction' || field === 'urgency') {
      setIntakeData(prev => ({ ...prev, [field]: value }));
    } else if (field === 'signature') {
      setIntakeData(prev => ({ ...prev, signature: value }));
    } else if (field === 'documents') {
      setIntakeData(prev => ({ ...prev, documents: value }));
    } else if (field === 'triageReasoning') {
      setIntakeData(prev => ({ ...prev, triageReasoning: value }));
    } else if (['name', 'email', 'phone'].includes(field)) {
      setIntakeData(prev => ({ ...prev, contact: { ...prev.contact, [field]: value } }));
    } else {
      setIntakeData(prev => ({ ...prev, details: { ...prev.details, [field]: value } }));
    }
  };

  const handleJurisdiction = (j: Jurisdiction) => {
    if (j === 'OTHER') {
      setView('not-eligible');
    } else {
      updateIntake('jurisdiction', j);
      setIntakeStep(1); 
      // Clear downstream data on restart/edit
      setAiRecommendation(null);
      updateIntake('serviceId', null);
    }
  };

  const handleTriageResult = (recommendation: AiRecommendation | null, description: string) => {
     setIntakeData(prev => ({ ...prev, details: { ...prev.details, description } }));
     
     if(recommendation) {
       setAiRecommendation(recommendation);
       updateIntake('triageReasoning', recommendation.reasoning);
       // Logic: If high confidence, we show confirmation screen (default state).
       // If low confidence, we show catalog immediately.
       if (recommendation.confidence === 'low') {
         setShowFullCatalog(true);
       } else {
         setShowFullCatalog(false);
       }
     } else {
       setAiRecommendation(null);
       setShowFullCatalog(true);
     }

     setIntakeStep(2);
  }
  
  const handleRecommendationConfirm = () => {
      if (aiRecommendation) {
          updateIntake('serviceId', aiRecommendation.serviceId as ServiceId);
          setIntakeStep(3);
      }
  }

  const handleServiceSelect = (sid: ServiceId) => {
    // If the selection is different from the recommendation, use the manual selection
    updateIntake('serviceId', sid);
    
    // Reset pricing dependent details if service type changes
    if (sid !== intakeData.serviceId) {
       setIntakeData(prev => ({
         ...prev,
         serviceId: sid,
         details: { description: prev.details.description }, // keep description
         documents: [],
         signature: undefined
       }));
    }
    setIntakeStep(3);
  };

  const handleSignature = () => {
    updateIntake('signature', {
      signedName: intakeData.contact.name,
      timestamp: new Date().toISOString(),
      agreed: true
    });
    setIntakeStep(6);
  }

  const handleCheckout = (totalPrice: number) => {
    backend.createMatter(intakeData, totalPrice);
    const newUser: UserProfile = {
      id: 'client-new',
      email: intakeData.contact.email,
      name: intakeData.contact.name,
      role: 'client'
    };
    setUser(newUser);
    setView('success');
  };

  const handleLogin = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    if (authenticatedUser.role === 'admin') {
      setView('admin');
    } else {
      setView('portal');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('home');
  };

  const handleViewChange = (newView: string) => {
    if ((newView === 'portal' || newView === 'admin') && !user) {
      setView('auth');
      return;
    }
    setView(newView);
  }
  
  const handleNavRequest = (stepIndex: number) => {
    if (stepIndex >= intakeStep) return;
    setNavTarget(stepIndex);
  };

  const handleNavConfirm = () => {
    if (navTarget === null) return;
    
    // Invalidation Logic
    if (navTarget <= 1) { // Going back to Jurisdiction or Triage
       // Keep description but invalidate recommendation and service
       setAiRecommendation(null); 
       updateIntake('serviceId', null);
       setShowFullCatalog(false);
    }
    if (navTarget === 0) { // Going back to Jurisdiction
        // Hard reset description too for consistency if needed, but let's keep it for now
    }
    
    if (navTarget < 6) { 
        updateIntake('signature', undefined);
    }
    
    setIntakeStep(navTarget);
    setNavTarget(null);
  };

  return (
    <Layout 
      currentView={view} 
      setView={handleViewChange} 
      user={user} 
      onLogout={handleLogout}
    >
      {view === 'home' && <Hero onStart={startIntake} />}
      
      {view === 'auth' && <AuthScreen onLogin={handleLogin} />}
      
      {view === 'not-eligible' && (
        <div className="max-w-2xl mx-auto mt-20 p-8 bg-white rounded-lg shadow text-center border border-slate-100">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">We can't help you just yet.</h2>
          <p className="text-slate-600 mb-6">
            To ensure ethical compliance, we only accept matters in TX, FL, and CO. 
            We recommend checking your local State Bar Association's referral service.
          </p>
          <button onClick={() => setView('home')} className="text-brand-600 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2">Back to Home</button>
        </div>
      )}

      {view === 'intake' && (
        <div className="py-12 px-4">
          <div className="max-w-4xl mx-auto mb-10">
            <nav aria-label="Progress">
              <ol role="list" className="flex items-center">
                {STEPS.map((step, stepIdx) => {
                    const isCompleted = stepIdx < intakeStep;
                    const isCurrent = stepIdx === intakeStep;
                    
                    return (
                      <li key={step.label} className={`${stepIdx !== STEPS.length - 1 ? 'w-full' : ''} relative`}>
                         {/* Line */}
                         {stepIdx !== STEPS.length - 1 && (
                           <div className="absolute top-4 left-0 -right-0 h-0.5 bg-slate-200" aria-hidden="true">
                             <div 
                                className="h-full bg-brand-600 transition-all duration-500" 
                                style={{ width: isCompleted ? '100%' : '0%' }} 
                             />
                           </div>
                         )}
                         
                         {/* Dot/Button */}
                         <button
                            onClick={() => handleNavRequest(stepIdx)}
                            disabled={!isCompleted} 
                            className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors z-10 bg-white
                                ${isCompleted ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-brand-500' : ''}
                                ${isCurrent ? 'border-brand-600 text-brand-600 ring-2 ring-offset-2 ring-brand-500 cursor-default' : ''}
                                ${!isCompleted && !isCurrent ? 'border-slate-300 text-slate-500 cursor-not-allowed' : ''}
                            `}
                            aria-current={isCurrent ? 'step' : undefined}
                            aria-label={`Go to step ${step.label}`}
                         >
                            {isCompleted ? <CheckCircle className="h-5 w-5" /> : stepIdx + 1}
                         </button>
                         
                         {/* Label */}
                         <div className="absolute top-10 left-4 -translate-x-1/2 w-32 flex justify-center">
                             <span className={`text-xs font-medium text-center
                                ${isCurrent ? 'text-brand-700' : 'text-slate-500'}
                             `}>
                                {step.label}
                             </span>
                         </div>
                      </li>
                    );
                })}
              </ol>
            </nav>
          </div>

          {intakeStep === 0 && <JurisdictionGate onSelect={handleJurisdiction} />}
          
          {intakeStep === 1 && (
            <TriageAssistant 
              currentInput={intakeData.details.description}
              onResult={handleTriageResult} 
              onSkip={() => {
                  setAiRecommendation(null);
                  setShowFullCatalog(true);
                  setIntakeStep(2);
              }} 
            />
          )}

          {intakeStep === 2 && (
             !showFullCatalog && aiRecommendation ? (
                 <ServiceRecommendation 
                    recommendation={aiRecommendation}
                    onConfirm={handleRecommendationConfirm}
                    onShowCatalog={() => setShowFullCatalog(true)}
                 />
             ) : (
                 <ServiceCatalog 
                    onSelect={handleServiceSelect} 
                    recommendation={aiRecommendation}
                    selectedId={intakeData.serviceId}
                 />
             )
          )}
          
          {intakeStep === 3 && (
            <DetailsForm 
              serviceId={intakeData.serviceId} 
              data={intakeData.details} 
              documents={intakeData.documents}
              onChange={updateIntake} 
              onNext={() => setIntakeStep(4)} 
            />
          )}
          {intakeStep === 4 && (
            <ContactForm
              contact={intakeData.contact}
              onChange={updateIntake}
              onNext={() => setIntakeStep(5)}
            />
          )}
          {intakeStep === 5 && (
            <EngagementLetter 
              data={intakeData}
              onSign={handleSignature}
              onEdit={() => setIntakeStep(4)}
            />
          )}
          {intakeStep === 6 && (
            <PaymentGateway 
              serviceId={intakeData.serviceId}
              data={intakeData}
              urgency={intakeData.urgency}
              setUrgency={(u: any) => updateIntake('urgency', u)}
              onCheckout={handleCheckout}
            />
          )}
        </div>
      )}

      {view === 'success' && <SuccessPage onGoToPortal={() => setView('portal')} />}
      
      {view === 'portal' && <ClientPortal />}
      
      {view === 'admin' && (
        <AdminDashboard isAuthenticated={!!user && user.role === 'admin'} />
      )}

      <NavConfirmModal 
        isOpen={navTarget !== null} 
        onConfirm={handleNavConfirm} 
        onCancel={() => setNavTarget(null)} 
        targetStepLabel={navTarget !== null ? STEPS[navTarget].label : ''}
      />

    </Layout>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);