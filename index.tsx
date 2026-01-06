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
  HelpCircle
} from 'lucide-react';

// --- TYPES ---

type Jurisdiction = 'TX' | 'FL' | 'CO' | 'OTHER';

type ServiceId = 'contract_review' | 'business_formation' | 'demand_letter';

interface ServiceTrack {
  id: ServiceId;
  title: string;
  description: string;
  basePrice: number;
  icon: React.ElementType;
}

interface IntakeData {
  jurisdiction: Jurisdiction;
  serviceId: ServiceId | null;
  urgency: 'standard' | 'rush';
  details: Record<string, any>;
  contact: {
    name: string;
    email: string;
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
        { timestamp: new Date().toISOString(), action: 'DISCLAIMER_ACCEPTED', details: 'User accepted NO A/C relationship' }
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
const Layout = ({ children, currentView, setView }: { children?: React.ReactNode, currentView: string, setView: (v: string) => void }) => (
  <div className="min-h-screen flex flex-col font-sans">
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <Shield className="h-8 w-8 text-brand-600" />
          <span className="font-bold text-xl text-slate-900 tracking-tight">SoloScale Legal</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
          <button onClick={() => setView('home')} className="hover:text-brand-600">Services</button>
          <button onClick={() => setView('portal')} className="hover:text-brand-600">Client Portal</button>
          <button onClick={() => setView('admin')} className="text-slate-400 hover:text-slate-600">Admin</button>
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

// 2. Marketing / Hero
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

// 3. Intake Wizard Components

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
const DetailsForm = ({ serviceId, data, onChange, onNext }: any) => {
  const service = SERVICES.find(s => s.id === serviceId);

  return (
    <WizardStep title={`Tell us about your ${service?.title}`}>
      <div className="space-y-6">
        {serviceId === 'contract_review' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Upload Document (Mock)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 cursor-pointer">
                <FileText className="mx-auto h-8 w-8 text-slate-400" />
                <span className="mt-2 block text-sm font-medium text-slate-600">Click to select file</span>
                <span className="text-xs text-slate-400">PDF or DOCX up to 10MB</span>
              </div>
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

// Step 4: Review & Pricing
const PricingReview = ({ serviceId, data, urgency, setUrgency, onCheckout }: any) => {
  const service = SERVICES.find(s => s.id === serviceId);
  
  const priceBreakdown = useMemo(() => {
    let base = service?.basePrice || 0;
    let complexity = 0;
    let rush = 0;

    if (serviceId === 'contract_review' && data.pageCount > 10) {
      complexity = (data.pageCount - 10) * 10; // $10 per extra page
    }
    if (serviceId === 'business_formation' && data.partnerCount > 1) {
      complexity = (data.partnerCount - 1) * 50; // $50 per extra partner
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

        <WizardStep title="Contact & Payment">
           <div className="space-y-4">
             <input type="text" placeholder="Full Name" className="w-full p-3 border rounded-md" />
             <input type="email" placeholder="Email Address" className="w-full p-3 border rounded-md" />
             
             <div className="mt-4 pt-4 border-t border-slate-100">
               <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 bg-yellow-50 p-3 rounded-md">
                 <Lock className="h-4 w-4" />
                 Payments processed securely via Stripe. Funds held until conflict check passes.
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
            Pay & Submit
          </button>
          <p className="mt-4 text-xs text-center text-slate-400">
            By clicking above, you agree to the Terms of Service and understand no attorney-client relationship is formed until explicitly confirmed.
          </p>
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
      We have received your payment and information. Your attorney is reviewing the file now.
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

const AdminDashboard = () => {
  const [matters, setMatters] = useState(backend.getMatters());

  return (
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
                 <p><strong>Client:</strong> Mock User</p>
                 {matter.data.details.opposingParty && (
                   <p className={backend.checkConflict(matter.data.details.opposingParty) ? "text-red-600 font-bold" : ""}>
                     <strong>Opposing:</strong> {matter.data.details.opposingParty} 
                     {backend.checkConflict(matter.data.details.opposingParty) && " (MATCH FOUND)"}
                   </p>
                 )}
                 <p className="truncate mt-1"><strong>Desc:</strong> {matter.data.details.description}</p>
               </div>

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
  );
};

// 6. Main App Controller
const App = () => {
  const [view, setView] = useState('home');
  const [intakeStep, setIntakeStep] = useState(0);
  const [intakeData, setIntakeData] = useState<IntakeData>({
    jurisdiction: 'TX',
    serviceId: null,
    urgency: 'standard',
    details: {},
    contact: { name: '', email: '' }
  });

  const startIntake = () => {
    setView('intake');
    setIntakeStep(0);
  };

  const updateIntake = (field: keyof IntakeData | string, value: any) => {
    if (field === 'serviceId' || field === 'jurisdiction' || field === 'urgency') {
      setIntakeData(prev => ({ ...prev, [field]: value }));
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

  const handleCheckout = (totalPrice: number) => {
    // Simulate backend call
    backend.createMatter(intakeData, totalPrice);
    setView('success');
  };

  return (
    <Layout currentView={view} setView={setView}>
      {view === 'home' && <Hero onStart={startIntake} />}
      
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
            {/* Progress Bar */}
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-600 transition-all duration-500"
                style={{ width: `${(intakeStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {intakeStep === 0 && <JurisdictionGate onSelect={handleJurisdiction} />}
          {intakeStep === 1 && <ServiceSelection onSelect={handleServiceSelect} />}
          {intakeStep === 2 && (
            <DetailsForm 
              serviceId={intakeData.serviceId} 
              data={intakeData.details} 
              onChange={updateIntake} 
              onNext={() => setIntakeStep(3)} 
            />
          )}
          {intakeStep === 3 && (
            <PricingReview 
              serviceId={intakeData.serviceId}
              data={intakeData.details}
              urgency={intakeData.urgency}
              setUrgency={(u: any) => updateIntake('urgency', u)}
              onCheckout={handleCheckout}
            />
          )}
        </div>
      )}

      {view === 'success' && <SuccessPage onGoToPortal={() => setView('portal')} />}
      
      {view === 'portal' && <ClientPortal />}
      
      {view === 'admin' && <AdminDashboard />}
    </Layout>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);