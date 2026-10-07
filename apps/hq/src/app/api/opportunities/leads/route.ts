import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export interface QualifiedLead {
  id: string;
  businessName: string;
  contact: string;
  platform: string;
  sourceQuery: string;
  location: string;
  category: 'SAAS_LANDING' | 'FINTECH_PIPELINE' | 'DEV_TOOL' | 'ECOMMERCE_STRIPE' | 'HIGH_TICKET_LOCAL' | 'AGENCY_BACKEND';
  technicalAudit: string;
  servicePackage: string;
  proposedPriceUSD: number;
  paymentLink?: string;
  proofProject: string;
  status: 'QUALIFIED' | 'CONTACTED' | 'RESPONDED' | 'PROPOSAL' | 'CLOSED';
  personalizedHook: string;
}

const LEADS_FILE = path.resolve(process.cwd(), '../../.gideon/scout_50_leads.json');

function getLeads(): QualifiedLead[] {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const data = fs.readFileSync(LEADS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Failed to read leads file, falling back:', err);
  }
  return [];
}

function saveLeads(leads: QualifiedLead[]) {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save leads file:', err);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase();

    let leads = getLeads();

    if (category && category !== 'ALL') {
      leads = leads.filter(l => l.category === category);
    }

    if (search) {
      leads = leads.filter(l => 
        l.businessName.toLowerCase().includes(search) ||
        l.contact.toLowerCase().includes(search) ||
        l.location.toLowerCase().includes(search) ||
        l.technicalAudit.toLowerCase().includes(search) ||
        l.platform.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      total: leads.length,
      leads
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'id and status required' }, { status: 400 });
    }

    const leads = getLeads();
    const lead = leads.find(l => l.id === id);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    lead.status = status;
    saveLeads(leads);

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
