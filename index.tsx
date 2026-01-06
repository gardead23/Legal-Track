import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
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
  Smartphone
} from 'lucide-react';

// --- TYPES ---

type Jurisdiction = 'TX' | 'FL' | 'CO' | 'OTHER';

type ServiceId = 'contract_review' | 'business_formation' | 'demand_letter';

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
}

interface SecureDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  secureUrl: string; // In real app, this is a signed URL
  uploadedAt: string;
}

interface IntakeData {
  jurisdiction: Jurisdiction;
  serviceId: ServiceId | null;
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

// --- MOCK BACKEND & CONFIG ---

const SERVICES: ServiceTrack[] = [
  {
    id: 'contract_review',
    title: 'Contract Review',
    description: 'Professional review of legal agreements with redlines.',
    basePrice: 250,
    icon: FileText
  },
  {
    id: 'business_formation',
    title: 'Business Formation',
    description: 'LLC or Corp registration including operating agreements.',
    basePrice: 400,
    icon: Briefcase
  },
  {
    id: 'demand_letter',
    title: 'Demand Letter',
    description: 'Formal demand for payment or performance.',
    basePrice: 200,
    icon: AlertTriangle
  }
];

// Simple in-memory store for MVP demo
class MockBackend {
  private matters: Matter[] = [];
  private conflictBlacklist = ['evil corp', 'bad guy', 'fraud llc'];

  // Normalize string for conflict check: lowercase, remove punctuation
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

// 1. Layout & Shared
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
  <div className="min-h-screen flex flex-col font-sans">
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <Shield className="h-8 w-8 text-brand-600" />
          <span className="font-bold text-xl text-slate-900 tracking-tight">SoloScale Legal</span>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <button onClick={() => setView('home')} className="hidden md:block hover:text-brand-600">Services</button>
          
          {user ? (
            <>
              {user.role === 'admin' ? (
                 <button onClick={() => setView('admin')} className={`hover:text-brand-600 ${currentView === 'admin' ? 'text-brand-600' : ''}`}>Dashboard</button>
              ) : (
                 <button onClick={() => setView('portal')} className={`hover:text-brand-600 ${currentView === 'portal' ? 'text-brand-600' : ''}`}>My Portal</button>
              )}
              
              <div className="h-6 w-px bg-slate-300 mx-2"></div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 hidden sm:inline-block">
                  {user.email} ({user.role})
                </span>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-1 text-slate-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <>
               <button onClick={() => setView('portal')} className="hover:text-brand-600">Client Portal</button>
               <button onClick={() => setView('admin')} className="text-slate-400 hover:text-slate-600">Admin</button>
            </>
          )}
        </nav>
      </div>
    </header>
    <main className="flex-grow bg-slate-50">
      {children}
    </main>
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm mb-4">
          © 2024 SoloScale Legal. Not a law firm. No attorney-client relationship is formed until a written agreement is signed.
        </p>
        <div className="flex justify-center gap-4 text-xs uppercase tracking-wider">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Attorney Advertising</span>
        </div>
      </div>
    </footer>
  </div>
);

// 2. Auth System (Feature 2)
const AuthScreen = ({ onLogin }: { onLogin: (user: UserProfile) => void }) => {
  const [step, setStep] = useState<'email' | 'magic_link' | 'password' | 'mfa'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
          <Shield className="mx-auto h-12 w-12 text-brand-600" />
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
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
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
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-70"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
             <input
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800"
              >
                {loading ? 'Verifying...' : 'Verify Password'}
              </button>
              <div className="text-center text-xs text-slate-400 mt-2">Hint: legal123</div>
          </form>
        )}

        {step === 'mfa' && (
          <form className="mt-8 space-y-6" onSubmit={handleMfaSubmit}>
             <div className="flex justify-center mb-4">
                <Smartphone className="h-16 w-16 text-slate-200" />
             </div>
             <input
                type="text"
                maxLength={6}
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 text-center tracking-widest text-2xl focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700"
              >
                {loading ? 'Authenticating...' : 'Verify Code'}
              </button>
              <div className="text-center text-xs text-slate-400 mt-2">Hint: 123456</div>
          </form>
        )}

        {step === 'magic_link' && (
          <div className="mt-8 text-center space-y-6">
            <div className="bg-green-50 p-4 rounded-lg text-green-700 text-sm">
              We've sent a temporary login link to <strong>{email}</strong>.
            </div>
            <div className="border-t border-slate-100 pt-6">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-4">Developer Mode</p>
              <button
                onClick={handleMagicLinkSimulate}
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-dashed border-brand-300 text-sm font-medium rounded-md text-brand-700 bg-brand-50 hover:bg-brand-100"
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

// 3. Marketing / Hero
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
        className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full shadow-sm text-white bg-brand-600 hover:bg-brand-700 transition-colors"
      >
        Start Intake
        <ArrowRight className="ml-2 h-5 w-5" />
      </button>
      
      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
        {[
          { icon: Clock, title: "Fast Turnaround", desc: "Rush options available for 24h delivery." },
          { icon: Lock, title: "Secure Portal", desc: "Bank-grade encryption for your documents." },
          { icon: CheckCircle, title: "Attorney Reviewed", desc: "Every deliverable is reviewed by a human." }
        ].map((feat, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-brand-100 text-brand-600 mb-4">
              <feat.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">{feat.title}</h3>
            <p className="mt-2 text-base text-slate-500">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// 4. Intake Wizard Components

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

// Step 1: Jurisdiction
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
            className="flex items-center justify-between p-4 border rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-all text-left group"
          >
            <span className="font-medium text-slate-900 group-hover:text-brand-700">{label}</span>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-brand-500" />
          </button>
        ))}
        <button
          onClick={() => onSelect('OTHER')}
          className="flex items-center justify-between p-4 border rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all text-left"
        >
          <span className="font-medium text-slate-600">Other State</span>
          <ChevronRight className="h-5 w-5 text-slate-300" />
        </button>
      </div>
    </WizardStep>
  );
};

// Step 2: Service Selection
const ServiceSelection = ({ onSelect }: { onSelect: (s: ServiceId) => void }) => (
  <WizardStep title="How can we help you?">
    <div className="grid grid-cols-1 gap-4">
      {SERVICES.map((service) => (
        <button
          key={service.id}
          onClick={() => onSelect(service.id)}
          className="flex items-start p-4 border rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-all text-left group"
        >
          <div className="flex-shrink-0 mt-1">
            <service.icon className="h-6 w-6 text-brand-500" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-slate-900 group-hover:text-brand-700">{service.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{service.description}</p>
            <p className="mt-2 text-sm font-semibold text-brand-600">Starts at ${service.basePrice}</p>
          </div>
        </button>
      ))}
    </div>
  </WizardStep>
);

// Step 3: Details (Dynamic Form)
const DetailsForm = ({ serviceId, data, documents, onChange, onNext }: any) => {
  const service = SERVICES.find(s => s.id === serviceId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Simulate reading and uploading to S3
      const reader = new FileReader();
      reader.onload = (event) => {
        const doc: SecureDocument = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          secureUrl: event.target?.result as string, // In production, this would be a signed URL
          uploadedAt: new Date().toISOString()
        };
        // Add to documents array
        const currentDocs = documents || [];
        onChange('documents', [...currentDocs, doc]);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <WizardStep title={`Tell us about your ${service?.title}`}>
      <div className="space-y-6">
        {serviceId === 'contract_review' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Upload Document (Secure)</label>
              
              {(!documents || documents.length === 0) ? (
                 <label className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 cursor-pointer block">
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.doc,.jpg,.png" />
                  <Upload className="mx-auto h-8 w-8 text-brand-500 mb-2" />
                  <span className="block text-sm font-medium text-slate-700">Click to upload file</span>
                  <span className="block text-xs text-slate-500 mt-1">PDF, DOCX up to 25MB</span>
                  <span className="block text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" /> Encrypted Storage
                  </span>
                </label>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc: SecureDocument) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-3">
                         <FileText className="h-5 w-5 text-green-600" />
                         <div>
                            <p className="text-sm font-medium text-green-800">{doc.name}</p>
                            <p className="text-xs text-green-600">{(doc.size / 1024).toFixed(1)} KB • Securely Uploaded</p>
                         </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                  <button 
                    onClick={() => onChange('documents', [])}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove and upload different file
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Page Count</label>
              <input 
                type="number" 
                min="1"
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="e.g. 5"
                value={data.pageCount || ''}
                onChange={(e) => onChange('pageCount', parseInt(e.target.value))}
              />
              <p className="text-xs text-slate-500 mt-1">Pricing adjusts based on length.</p>
            </div>
          </>
        )}

        {serviceId === 'business_formation' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Desired Business Name</label>
              <input 
                type="text" 
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="e.g. Acme Innovations LLC"
                value={data.businessName || ''}
                onChange={(e) => onChange('businessName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Number of Partners/Members</label>
              <input 
                type="number" 
                min="1"
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={data.partnerCount || ''}
                onChange={(e) => onChange('partnerCount', parseInt(e.target.value))}
              />
            </div>
          </>
        )}

        {(serviceId === 'demand_letter' || serviceId === 'contract_review') && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-slate-700">Opposing Party Name</label>
              <div className="relative group">
                <span className="text-xs text-slate-400 underline decoration-dotted hover:text-slate-600 cursor-help transition-colors">
                  Why are we asking this?
                </span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
                  <p className="font-bold mb-1 text-slate-200">Why are we asking this?</p>
                  <p className="leading-relaxed">We use this to identify all parties involved and ensure there are no conflicts before proceeding. It helps us organize your request accurately.</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </div>
            </div>
            <input 
              type="text" 
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="Who is this regarding?"
              value={data.opposingParty || ''}
              onChange={(e) => onChange('opposingParty', e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">Required for conflict check.</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Brief Description of Goals</label>
          <textarea 
            rows={4}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none"
            placeholder="What outcome are you looking for?"
            value={data.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
          />
        </div>

        <button 
          onClick={onNext}
          disabled={!data.description} // Simple validation
          className="w-full bg-brand-600 text-white py-3 rounded-md font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </WizardStep>
  );
};

// Step 4: Contact Info
const ContactForm = ({ contact, onChange, onNext }: any) => {
  const isComplete = contact.name && contact.email && contact.phone;

  return (
    <WizardStep title="Your Contact Information">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Legal Name</label>
          <input 
            type="text" 
            placeholder="Jane Doe" 
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none"
            value={contact.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1">This name will appear on your engagement letter.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              placeholder="jane@example.com" 
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none"
              value={contact.email}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input 
              type="tel" 
              placeholder="(555) 123-4567" 
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none"
              value={contact.phone}
              onChange={(e) => onChange('phone', e.target.value)}
            />
          </div>
        </div>

        <button 
          onClick={onNext}
          disabled={!isComplete}
          className="w-full bg-brand-600 text-white py-3 rounded-md font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          Review Agreement
        </button>
      </div>
    </WizardStep>
  );
};

// Step 5: Engagement Letter
const EngagementLetter = ({ data, onSign }: any) => {
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState('');
  const [date] = useState(new Date().toLocaleDateString());
  
  const service = SERVICES.find(s => s.id === data.serviceId);
  
  // Calculate price again solely for display in contract (simplified)
  // In a real app, pass the calculated price prop down
  const basePrice = service?.basePrice || 0;

  const canSign = agreed && signature.toLowerCase().trim() === data.contact.name.toLowerCase().trim();

  return (
    <WizardStep title="Limited Scope Representation Agreement">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 h-64 overflow-y-auto mb-6 text-sm text-slate-700 font-mono leading-relaxed">
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
          <strong>3. FEES.</strong> Client agrees to pay a flat fee starting at ${basePrice} (subject to complexity adjustments confirmed at checkout). Fees are earned upon receipt but held subject to refund if a conflict of interest is discovered.
        </p>
        <p className="mb-4">
          <strong>4. NO GUARANTEE.</strong> Attorney cannot guarantee the outcome of any legal matter.
        </p>
        <p className="mb-4">
          <strong>5. TERMINATION.</strong> Client may terminate this agreement at any time. Attorney may withdraw for ethical reasons or non-payment.
        </p>
      </div>

      <div className="space-y-6">
        <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-slate-50">
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
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Digital Signature
          </label>
          <div className="relative">
            <input 
              type="text" 
              placeholder={`Type "${data.contact.name}" to sign`}
              className="w-full p-3 pl-10 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none font-serif italic text-lg"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
            <FileSignature className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            By typing your name, you are signing this agreement electronically pursuant to the ESIGN Act.
          </p>
        </div>

        <button 
          onClick={onSign}
          disabled={!canSign}
          className="w-full bg-slate-900 text-white py-3 rounded-md font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <PenTool className="h-4 w-4" />
          Sign & Continue to Payment
        </button>
      </div>
    </WizardStep>
  );
};

// Step 6: Payment (Formerly PricingReview)
const PaymentGateway = ({ serviceId, data, urgency, setUrgency, onCheckout }: any) => {
  const service = SERVICES.find(s => s.id === serviceId);
  
  const priceBreakdown = useMemo(() => {
    let base = service?.basePrice || 0;
    let complexity = 0;
    let rush = 0;

    if (serviceId === 'contract_review' && data.details.pageCount > 10) {
      complexity = (data.details.pageCount - 10) * 10; // $10 per extra page
    }
    if (serviceId === 'business_formation' && data.details.partnerCount > 1) {
      complexity = (data.details.partnerCount - 1) * 50; // $50 per extra partner
    }

    const subtotal = base + complexity;
    if (urgency === 'rush') {
      rush = subtotal * 0.5; // 50% rush fee
    }

    return { base, complexity, rush, total: subtotal + rush };
  }, [serviceId, data, urgency]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <div className="lg:col-span-2 space-y-6">
        <WizardStep title="Select Turnaround Time">
          <div className="space-y-4">
            <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${urgency === 'standard' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'hover:border-slate-300'}`}>
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

            <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${urgency === 'rush' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'hover:border-slate-300'}`}>
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
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                   <p className="text-sm font-bold text-green-800">Agreement Signed</p>
                   <p className="text-xs text-green-700">Signed by {data.signature?.signedName} on {new Date(data.signature?.timestamp).toLocaleDateString()}</p>
                </div>
             </div>

             <div className="mt-4 pt-4 border-t border-slate-100">
               <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 bg-yellow-50 p-3 rounded-md">
                 <Lock className="h-4 w-4" />
                 Funds will be authorized now but only captured after attorney conflict check.
               </div>
               <div className="p-4 border rounded-md bg-slate-50 flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-slate-400" />
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
            className="w-full mt-6 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-md"
          >
            Authorize Payment
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. Success / Next Steps
const SuccessPage = ({ onGoToPortal }: { onGoToPortal: () => void }) => (
  <div className="max-w-2xl mx-auto text-center pt-10">
    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
      <CheckCircle className="h-10 w-10 text-green-600" />
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
      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-brand-700 bg-brand-100 hover:bg-brand-200"
    >
      Go to Client Portal
    </button>
  </div>
);

// 5. Portals (Client & Admin)

const ClientPortal = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
    <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Matters</h2>
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-slate-200">
        {[
          { id: 'M-1024', title: 'Contract Review - SAAS Agreement', status: 'Reviewing', date: 'Oct 24, 2023' },
          { id: 'M-0998', title: 'LLC Formation - TechCo', status: 'Completed', date: 'Sep 12, 2023' }
        ].map((matter) => (
          <li key={matter.id}>
            <div className="px-4 py-4 sm:px-6 hover:bg-slate-50 transition flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-brand-600 truncate">{matter.title}</div>
                <div className="flex items-center mt-1">
                  <p className="text-sm text-slate-500 mr-4">ID: {matter.id}</p>
                  <p className="text-sm text-slate-500">{matter.date}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  matter.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {matter.status}
                </span>
                <ChevronRight className="ml-4 h-5 w-5 text-slate-400" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const SecureDocViewer = ({ doc, onClose }: { doc: SecureDocument, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-brand-100 rounded-md">
                <FileText className="h-5 w-5 text-brand-700" />
             </div>
             <div>
               <h3 className="font-bold text-slate-900">{doc.name}</h3>
               <p className="text-xs text-slate-500">SECURE VIEWER • READ ONLY</p>
             </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
             <X className="h-6 w-6 text-slate-500" />
           </button>
        </div>
        
        {/* Content Area */}
        <div className="flex-grow bg-slate-200 relative overflow-y-auto flex items-center justify-center p-8">
           {/* Watermark Overlay */}
           <div className="absolute inset-0 pointer-events-none z-10 flex flex-wrap content-start justify-start opacity-10 select-none overflow-hidden">
             {Array.from({ length: 40 }).map((_, i) => (
               <div key={i} className="text-slate-900 font-bold text-xl rotate-[-30deg] p-12 whitespace-nowrap">
                  CONFIDENTIAL // ATTORNEY EYES ONLY
               </div>
             ))}
           </div>
           
           {/* Document Preview */}
           <div className="bg-white shadow-lg max-w-full z-0 relative">
              {doc.type.includes('image') ? (
                <img src={doc.secureUrl} alt="Secure Preview" className="max-w-full max-h-[70vh] object-contain" />
              ) : (
                <div className="w-[600px] h-[700px] flex flex-col items-center justify-center p-12 text-slate-400 border border-slate-300">
                   <FileText className="h-24 w-24 mb-4" />
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
                    <h3 className="font-bold text-lg">{matter.data.serviceId?.replace('_', ' ').toUpperCase()}</h3>
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
                        <Clock className="h-3 w-3 mr-1" /> RUSH
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 mb-4">
                  <p><strong>Client:</strong> {matter.data.contact.name} <span className="text-slate-400 text-xs">({matter.data.contact.email})</span></p>
                  {matter.data.details.opposingParty && (
                    <p className={backend.checkConflict(matter.data.details.opposingParty) ? "text-red-600 font-bold" : ""}>
                      <strong>Opposing:</strong> {matter.data.details.opposingParty} 
                      {backend.checkConflict(matter.data.details.opposingParty) && " (MATCH FOUND)"}
                    </p>
                  )}
                  <p className="truncate mt-1"><strong>Desc:</strong> {matter.data.details.description}</p>
                </div>

                {/* Documents Section */}
                {matter.data.documents && matter.data.documents.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Secure Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {matter.data.documents.map((doc, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setViewingDoc(doc)}
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded hover:border-brand-500 hover:text-brand-600 transition-colors text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          {doc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3 mt-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Audit Log</h4>
                  <div className="space-y-1">
                    {matter.auditLog.map((log, idx) => (
                      <div key={idx} className="flex text-xs text-slate-500">
                          <span className="w-24 flex-shrink-0 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className="font-medium mr-2">{log.action}:</span>
                          <span className="truncate">{log.details}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
            <h3 className="font-bold text-slate-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Revenue (Simulated)</span>
                <span className="font-mono font-bold text-green-600">
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

// 6. Main App Controller
const App = () => {
  const [view, setView] = useState('home');
  const [intakeStep, setIntakeStep] = useState(0);
  
  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  
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
  };

  const updateIntake = (field: string, value: any) => {
    if (field === 'serviceId' || field === 'jurisdiction' || field === 'urgency') {
      setIntakeData(prev => ({ ...prev, [field]: value }));
    } else if (field === 'signature') {
      setIntakeData(prev => ({ ...prev, signature: value }));
    } else if (field === 'documents') {
      setIntakeData(prev => ({ ...prev, documents: value }));
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
    }
  };

  const handleServiceSelect = (sid: ServiceId) => {
    updateIntake('serviceId', sid);
    setIntakeStep(2);
  };

  const handleSignature = () => {
    updateIntake('signature', {
      signedName: intakeData.contact.name,
      timestamp: new Date().toISOString(),
      agreed: true
    });
    setIntakeStep(5);
  }

  const handleCheckout = (totalPrice: number) => {
    backend.createMatter(intakeData, totalPrice);
    // Auto-login user after successful submission
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

  // Route Guard / Redirect Logic
  const handleViewChange = (newView: string) => {
    if ((newView === 'portal' || newView === 'admin') && !user) {
      setView('auth');
      return;
    }
    setView(newView);
  }

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
        <div className="max-w-2xl mx-auto mt-20 p-8 bg-white rounded-lg shadow text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">We can't help you just yet.</h2>
          <p className="text-slate-600 mb-6">
            To ensure ethical compliance, we only accept matters in TX, FL, and CO. 
            We recommend checking your local State Bar Association's referral service.
          </p>
          <button onClick={() => setView('home')} className="text-brand-600 font-medium hover:underline">Back to Home</button>
        </div>
      )}

      {view === 'intake' && (
        <div className="py-12 px-4">
          <div className="max-w-3xl mx-auto mb-8">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-600 transition-all duration-500"
                style={{ width: `${(intakeStep / 5) * 100}%` }}
              />
            </div>
          </div>

          {intakeStep === 0 && <JurisdictionGate onSelect={handleJurisdiction} />}
          {intakeStep === 1 && <ServiceSelection onSelect={handleServiceSelect} />}
          {intakeStep === 2 && (
            <DetailsForm 
              serviceId={intakeData.serviceId} 
              data={intakeData.details} 
              documents={intakeData.documents}
              onChange={updateIntake} 
              onNext={() => setIntakeStep(3)} 
            />
          )}
          {intakeStep === 3 && (
            <ContactForm
              contact={intakeData.contact}
              onChange={updateIntake}
              onNext={() => setIntakeStep(4)}
            />
          )}
          {intakeStep === 4 && (
            <EngagementLetter 
              data={intakeData}
              onSign={handleSignature}
            />
          )}
          {intakeStep === 5 && (
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
    </Layout>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);