'use server';

import { cookies } from 'next/headers';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  buyer: {
    name: string;
    email: string;
    address: string;
  };
  worker: {
    name: string;
    email: string;
  };
  items: {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'Paid' | 'Pending';
}

const mockInvoiceData: InvoiceData = {
  invoiceNumber: "INV-2024-001",
  date: "2024-01-15",
  dueDate: "2024-02-14",
  buyer: {
    name: "John Smith",
    email: "john.smith@example.com",
    address: "123 Business Street\nLondon, UK\nSW1A 1AA"
  },
  worker: {
    name: "Sarah Johnson",
    email: "sarah.j@example.com"
  },
  items: [
    {
      description: "Bartender Services - Corporate Event",
      quantity: 1,
      rate: 150.00,
      amount: 150.00
    },
    {
      description: "Additional Hours",
      quantity: 2,
      rate: 25.00,
      amount: 50.00
    }
  ],
  subtotal: 200.00,
  tax: 40.00,
  total: 240.00,
  status: "Paid"
};

export async function getInvoiceData(userId: string, invoiceId: string): Promise<InvoiceData> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  const isViewQA = cookieStore.get('isViewQA')?.value === 'true';

//   if (!token && !isViewQA) {
//     redirect('/signin');
//   }

  if (isViewQA) {
    return mockInvoiceData;
  }

  try {
    const response = await fetch(`${process.env.API_URL}/api/invoices/${invoiceId}`, {
      headers: {
        'Authorization': `Bearer ${token?.value}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch invoice data');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching invoice data:', error);
    throw new Error('Failed to fetch invoice data');
  }
} 