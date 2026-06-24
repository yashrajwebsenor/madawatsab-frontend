"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, Card, Chip, Spinner } from "@heroui/react";
import dayjs from "dayjs";
import { IoDownloadOutline, IoReceiptOutline } from "react-icons/io5";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { Invoice } from "@/app/types/types";
import { PaymentTypes } from "@/app/types/enum";
import PageHeaderWrapper from "@/app/components/shared/PageHeaderWrapper";
import { downloadInvoicePdf } from "@/app/utils/invoice-pdf";

const inr = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const InvoiceRow = ({ invoice }: { invoice: Invoice }) => {
  const isEntryFee = invoice.paymentType === PaymentTypes.entry_fee;

  return (
    <Card shadow="sm" className="w-full p-4 border border-default-100">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-primary/10 text-primary p-2.5 rounded-lg shrink-0">
            <IoReceiptOutline size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {invoice.planName ?? "Payment"}
            </p>
            <p className="text-xs text-default-400">
              {invoice.invoiceNumber ?? "—"} ·{" "}
              {dayjs(invoice.purchasedAt).format("DD MMM YYYY")}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="font-bold text-foreground">{inr(invoice.amount)}</p>
            <Chip
              size="sm"
              variant="flat"
              color={isEntryFee ? "default" : "primary"}
            >
              {isEntryFee ? "Entry Fee" : "Plan"}
            </Chip>
          </div>
          <Button
            isIconOnly
            variant="flat"
            color="primary"
            aria-label="Download invoice PDF"
            onPress={() => downloadInvoicePdf(invoice)}
          >
            <IoDownloadOutline size={18} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

const page = () => {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async (): Promise<Invoice[]> => {
      const res: any = await api.get(ENDPOINTS.PAYMENTS.INVOICES);
      return (res?.data ?? []) as Invoice[];
    },
  });

  return (
    <div>
      <PageHeaderWrapper>
        <div className="container">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/60">
            Dashboard / <span className="text-amber-300">Billing</span>
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white">
            Billing &amp; Invoices
          </h2>
          <p className="mt-1 text-sm text-gray-300">
            Your plan and entry-fee payment history. Download any invoice as a
            PDF.
          </p>
        </div>
      </PageHeaderWrapper>

      <div className="container py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner color="primary" />
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg font-semibold text-primary">
              No invoices yet
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
              Your entry-fee and plan purchases will appear here with a
              downloadable invoice.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-3">
            {invoices.map((invoice, i) => (
              <InvoiceRow
                key={invoice.invoiceNumber ?? `${invoice.purchasedAt}-${i}`}
                invoice={invoice}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default page;
