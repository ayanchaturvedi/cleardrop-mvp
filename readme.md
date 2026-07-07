# **ClearDrop Logistics Milestone Platform**

ClearDrop is a modern, multi-tenant B2B logistics and tracking platform designed to streamline parcel movement, automate driver handoffs, and offer complete visibility to both admins and end-customers.

Built with a responsive, mobile-first design, ClearDrop connects desktop dispatch admins with mobile drivers and consumers in real-time, backed by a persistent cloud database.

## **🚀 Key Features**

### **1\. Multi-Tenant Registration & White-Labeling**

* **Custom Sign-Up Flow:** Organizations can register their business with a company name, admin email, custom logo URL, and primary support contact.  
* **Dynamic Theme Branding:** Top navigation headers, tracking interfaces, and customer pages dynamically adapt to render the registered company's name and brand logo rather than a generic template.  
* **Flexible Fallbacks:** If a parcel has no specific driver assigned, communication buttons automatically default to calling the organization's primary support desk.

### **2\. Live Driver Management & Persistent Database Sync**

* **Database Persistence:** Transitioned from volatile browser localStorage to persistent cloud-based **Supabase (PostgreSQL)** tables.  
* **Driver Dispatch:** Admins can easily add, view, and modify transport drivers. Registered driver lists remain persistent across page refreshes and are universally fetched across devices.

### **3\. Flexible QR Code Handoff Sequence**

* **Any-Milestone Transfer:** Drivers can trigger a secure parcel handoff at *any* point in the delivery journey, generating an on-screen dynamic QR code containing the exact parcelId.  
* **Simulated Camera Scanning:** Receiving drivers can instantly scan this QR code via an on-screen camera-view viewport, dynamically re-assigning the database's current\_driver\_id and writing a transfer event to the milestone ledger.

### **4\. Custom Delay / Issue Reporting**

* **Dropdown Selection & Custom Overrides:** Drivers can flag active issues (e.g., Traffic, Weather, Vehicle Breakdown) or select **"Other"** to open a conditional custom textarea input for manual explanations.  
* **High-Visibility Banners:** Once reported, a real-time amber delay notification banner and localized history alert populate on the customer's portal instantly.

### **5\. Interactive Customer Tracking View**

* **Vertical Milestone Timeline:** Displays chronological order milestones, current package handlers (driver names, phone numbers), and detailed transit history logs.  
* **One-Click Call Buttons:** Seamless integrations using native phone directory links (href="tel:...") allow customers to dial the active handler or company support team directly from their mobile screen.

## **🛠️ Tech Stack**

* **Frontend:** React.js (Vite), Tailwind CSS, Lucide React (Icons)  
* **Backend Database:** Supabase (PostgreSQL), SQL Ledger Structures  
* **Deployment/Hosting:** Vercel (Cloud Continuous Deployment)  
* **Routing Support:** Vercel JSON URL Rewrites for Single Page Application (SPA) support

## **🗄️ Database Architecture (Supabase SQL)**

Paste the following DDL script into the **Supabase SQL Editor** to automatically structure the tables with disabled Row-Level Security (RLS) for testing purposes:

\-- Create Organizations Table  
CREATE TABLE public.organizations (  
    id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,  
    name TEXT NOT NULL,  
    email TEXT UNIQUE NOT NULL,  
    logo\_url TEXT,  
    support\_phone TEXT NOT NULL,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL  
);

\-- Create Drivers Table  
CREATE TABLE public.drivers (  
    id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,  
    name TEXT NOT NULL,  
    phone TEXT NOT NULL,  
    vehicle\_number TEXT NOT NULL,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL  
);

\-- Create Parcels Table  
CREATE TABLE public.parcels (  
    id TEXT PRIMARY KEY, \-- CD-XXXXXXX format  
    sender\_name TEXT NOT NULL,  
    recipient\_phone TEXT NOT NULL,  
    details TEXT NOT NULL,  
    destination TEXT NOT NULL,  
    status TEXT DEFAULT 'Pending Pickup' NOT NULL,  
    current\_driver\_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,  
    delay\_flag BOOLEAN DEFAULT false NOT NULL,  
    delay\_reason TEXT,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL  
);

\-- Create Milestone Logs Table  
CREATE TABLE public.milestone\_logs (  
    id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,  
    parcel\_id TEXT REFERENCES public.parcels(id) ON DELETE CASCADE NOT NULL,  
    status TEXT NOT NULL,  
    description TEXT NOT NULL,  
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL  
);

\-- Disable Row Level Security (RLS) for seamless MVP testing  
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;  
ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;  
ALTER TABLE public.parcels DISABLE ROW LEVEL SECURITY;  
ALTER TABLE public.milestone\_logs DISABLE ROW LEVEL SECURITY;

## **⚙️ Environment Configurations (.env)**

Create a .env file in your root folder. **Vite requires environment variables to start with VITE\_** to be correctly bundled into client files:

VITE\_SUPABASE\_URL=\[https://lffblhlsrvvujjapwbjb.supabase.co\](https://lffblhlsrvvujjapwbjb.supabase.co)  
VITE\_SUPABASE\_ANON\_KEY=your\_actual\_supabase\_anon\_public\_key\_string

**Note:** Do not commit your real .env file containing private API keys to GitHub.

## **📦 Local Setup Instructions**

1. **Clone the repository:**  
   git clone \[https://github.com/ayanchaturvedi/cleardrop-mvp.git\](https://github.com/ayanchaturvedi/cleardrop-mvp.git)  
   cd cleardrop-mvp

2. **Install project dependencies:**  
   npm install

3. **Spin up your local dev server:**  
   npm run dev

## **🚀 Cloud Deployment**

### **Vercel Deployment Instructions**

1. Log in to [Vercel](https://vercel.com) using your GitHub account.  
2. Select **"Add New Project"** and import your cleardrop-mvp repository.  
3. Open **Environment Variables** in the Vercel Setup Wizard and add:  
   * VITE\_SUPABASE\_URL  
   * VITE\_SUPABASE\_ANON\_KEY  
4. Deploy.

### **Fixing Vercel Routing / Deep-Link 404s**

React uses client-side routing. If you navigate to sub-routes (e.g., /driver or /track) on a mobile phone, Vercel will attempt to look up physical folders on its server and return a 404 NOT\_FOUND error.

We resolve this by redirecting all incoming paths directly to index.html via a configuration file. Create a file named vercel.json in the root of your project:

{  
  "rewrites": \[  
    {  
      "source": "/(.\*)",  
      "destination": "/index.html"  
    }  
  \]  
}

## **🤝 Project Validation Diagram**

\+-------------------+             \+-----------------------+             \+-----------------------+  
|  Admin Dashboard  |             |   Driver Dashboard    |             | Customer Tracking view|  
|   (Create Parcel, |             | (Accept, Progress, or |             |  (Real-Time Timeline, |  
|   Manage Drivers, |             |  Initiate QR Handoff  |             |  Call Carrier Links,  |  
|  White-Label Settings)          |   At Any Milestone)   |             |   Active Delay Flag)  |  
\+---------+---------+             \+-----------+-----------+             \+-----------+-----------+  
          |                                   |                                     |  
          \+-----------------+-----------------+-------------------------------------+  
                            | (Real-time read/write sync)  
                            v  
               \+-----------------------------+  
               |   Supabase Cloud Database   |  
               | (Postgres Persistent Tables)|  
               \+-----------------------------+  
