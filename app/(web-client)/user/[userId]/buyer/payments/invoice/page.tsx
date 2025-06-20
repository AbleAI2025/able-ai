"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import styles from "./Invoice.module.css";
import { useAuth } from "@/context/AuthContext";

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
  status: "Paid" | "Pending";
}

export default function InvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: loadingAuth } = useAuth();

  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true); // This is for data loading, loadingAuth is for user context

  // Data Fetching Effect
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const invoiceId = searchParams.get("id");
        if (!invoiceId) {
          throw new Error("Invoice ID is required");
        }
        const mockInvoiceData: InvoiceData = {
          invoiceNumber: "INV-2024-001",
          date: "2024-01-15",
          dueDate: "2024-02-14",
          buyer: {
            name: "John Smith",
            email: "john.smith@example.com",
            address: "123 Business Street\nLondon, UK\nSW1A 1AA",
          },
          worker: {
            name: "Sarah Johnson",
            email: "sarah.j@example.com",
          },
          items: [
            {
              description: "Bartender Services - Corporate Event",
              quantity: 1,
              rate: 150.0,
              amount: 150.0,
            },
            {
              description: "Additional Hours",
              quantity: 2,
              rate: 25.0,
              amount: 50.0,
            },
          ],
          subtotal: 200.0,
          tax: 40.0,
          total: 240.0,
          status: "Paid",
        };
        // const data = await getInvoiceData(params.userId, invoiceId);
        setInvoiceData(mockInvoiceData);
      } catch (error) {
        console.error("Error fetching invoice data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (loadingAuth) {
      return; // Wait for user context to be loaded before deciding to fetch data
    }

    if (user?.claims.role == "QA") {
      // QA users get mock data regardless of their own authUserId vs params.userId
      fetchInvoiceData();
    } else if (user && user?.uid === params.userId) {
      // Non-QA users must be authenticated and authorized
      fetchInvoiceData();
    } else if (user?.claims.role !== "QA" && !user) {
      // This case should ideally be caught by the auth useEffect and result in a redirect.
      // If reached, ensure loading stops.
      console.warn(
        "Invoice data fetch attempted by non-QA, non-authenticated user."
      );
      setIsLoading(false);
    }
    // No fetch if authenticated but not authorized (and not QA), as they'd be redirected.
  }, [user, loadingAuth, params.userId, searchParams]);

  const handlePrint = () => {
    window.print();
  };

  // Show loading if either user context is loading or invoice data is loading
  if (loadingAuth || isLoading) {
    return <div className={styles.loading}>Loading invoice...</div>;
  }

  if (!invoiceData) {
    return <div className={styles.error}>Invoice not found</div>;
  }

  return (
    <div className={styles.container}>
      {user?.claims.role === "QA" && (
        <div className={styles.qaIndicator}>QA View - Mock Data</div>
      )}
      <div className={styles.printButtonContainer}>
        <button onClick={handlePrint} className={styles.printButton}>
          Print Invoice
        </button>
      </div>

      <div className={styles.invoice}>
        <header className={styles.header}>
          <div className={styles.companyInfo}>
            <h1>Able AI</h1>
            <p>123 Business Street</p>
            <p>London, UK</p>
          </div>
          <div className={styles.invoiceInfo}>
            <h2>INVOICE</h2>
            <p>Invoice #: {invoiceData.invoiceNumber}</p>
            <p>Date: {invoiceData.date}</p>
            <p>Due Date: {invoiceData.dueDate}</p>
          </div>
        </header>

        <div className={styles.billingInfo}>
          <div className={styles.buyerInfo}>
            <h3>Bill To:</h3>
            <p>{invoiceData.buyer.name}</p>
            <p>{invoiceData.buyer.email}</p>
            <p>{invoiceData.buyer.address}</p>
          </div>
          <div className={styles.workerInfo}>
            <h3>Worker:</h3>
            <p>{invoiceData.worker.name}</p>
            <p>{invoiceData.worker.email}</p>
          </div>
        </div>

        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, index) => (
              <tr key={index}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>£{item.rate.toFixed(2)}</td>
                <td>£{item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Subtotal:</span>
            <span>£{invoiceData.subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Tax (20%):</span>
            <span>£{invoiceData.tax.toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Total:</span>
            <span>£{invoiceData.total.toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.status}>
          <p>
            Status:{" "}
            <span className={styles[invoiceData.status.toLowerCase()]}>
              {invoiceData.status}
            </span>
          </p>
        </div>

        <footer className={styles.footer}>
          <p>Thank you for your business!</p>
          <p>Payment is due within 30 days</p>
        </footer>
      </div>
    </div>
  );
}
