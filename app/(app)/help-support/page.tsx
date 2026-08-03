"use client";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import LoadingProgress from "@/app/components/shared/LoadingProgress";
import PageHeaderWrapper from "@/app/components/shared/PageHeaderWrapper";
import TableDate from "@/app/components/tables/TableDate";
import usePagination from "@/app/hooks/usePagination";
import { HelpSupport, HelpSupportFaq } from "@/app/types/types";
import CityOfficeCard from "@/app/components/shared/CityOfficeCard";
import CommonUtils from "@/app/utils/common.utils";
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FiChevronDown, FiHelpCircle } from "react-icons/fi";
import HelpSupportForm from "./HelpSupportForm";

const HelpSupportPage = () => {
  const { page, setTotalPages, renderPagination } = usePagination();
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const { data: faqs = [], isLoading: isFaqLoading } = useQuery({
    queryKey: ["help-support-faqs"],
    queryFn: async () => {
      const res = (await api.get(ENDPOINTS.HELP_SUPPORT.FAQS)) as unknown as {
        data: HelpSupportFaq[];
      };
      return res?.data || [];
    },
  });

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["help-supports", page],
    queryFn: async () => {
      const res = (await api.get(ENDPOINTS.HELP_SUPPORT.LIST, {
        params: {
          page,
          limit: 10,
        },
      })) as unknown as {
        data: HelpSupport[];
        pagination?: { totalPages?: number };
      };
      setTotalPages(res?.pagination?.totalPages ?? 1);
      return (res?.data || []) as HelpSupport[];
    },
  });

  return (
    <div>
      <PageHeaderWrapper>
        <div className="container">
          <h2 className="text-white text-2xl sm:text-3xl font-semibold">Help & Supports</h2>
          <p className="text-gray-300 text-sm mt-1">
            Contact our support team for assistance or inquiries.
          </p>
        </div>
      </PageHeaderWrapper>

      <div className="container py-8 pb-20">
        <section className="mb-8 overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-white via-primary-50/40 to-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,0.42fr)_1fr]">
            <div className="border-b border-primary-100/70 p-6 md:p-8 lg:border-b-0 lg:border-r">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                <FiHelpCircle className="text-xl" />
              </div>
              <h3 className="text-2xl font-bold leading-tight text-foreground">
                Frequently asked questions
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-default-500">
                Check the common answers first. If your question is still open,
                send us a request below.
              </p>
            </div>

            <div className="p-4 md:p-6">
              {isFaqLoading ? (
                <div className="rounded-2xl bg-white/80 p-8">
                  <LoadingProgress />
                </div>
              ) : faqs.length > 0 ? (
                <div className="space-y-3">
                  {faqs.map((faq, index) => {
                    const isOpen = openFaqId === faq._id;

                    return (
                      <article
                        key={faq._id}
                        className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                          isOpen
                            ? "border-primary-200 shadow-lg shadow-primary/10"
                            : "border-divider shadow-sm hover:border-primary-100 hover:shadow-md"
                        }`}
                      >
                        <button
                          type="button"
                          className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:px-5"
                          aria-expanded={isOpen}
                          aria-controls={`faq-answer-${faq._id}`}
                          onClick={() =>
                            setOpenFaqId((current) =>
                              current === faq._id ? null : faq._id,
                            )
                          }
                        >
                          <span className="flex min-w-0 items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors duration-300 ${
                                isOpen
                                  ? "bg-primary text-white"
                                  : "bg-default-100 text-default-500"
                              }`}
                            >
                              {index + 1}
                            </span>
                            <span className="text-sm font-semibold leading-6 text-foreground md:text-base">
                              {faq.question}
                            </span>
                          </span>
                          <span
                            className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                              isOpen
                                ? "rotate-180 bg-primary-50 text-primary"
                                : "bg-default-50 text-default-400"
                            }`}
                          >
                            <FiChevronDown />
                          </span>
                        </button>

                        <div
                          id={`faq-answer-${faq._id}`}
                          className={`grid transition-all duration-300 ease-out ${
                            isOpen
                              ? "grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="px-4 pb-5 pl-14 text-sm leading-7 text-default-600 md:px-5 md:pl-[4.25rem]">
                              {faq.answer}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-primary-200 bg-white/80 p-6 text-sm leading-6 text-default-500">
                  No FAQs are available right now.
                </div>
              )}
            </div>
          </div>
        </section>

        <HelpSupportForm refetch={refetch} />

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6 px-2">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Recent Requests
              </h3>
              <p className="text-default-500 text-sm">
                Track the status of your support inquiries.
              </p>
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-medium text-default-600 bg-default-100 px-4 py-2 rounded-xl border border-divider">
                Showing {data?.length || 0} records
              </span>
            </div>
          </div>

          <Table
            shadow="none"
            className="border border-divider rounded-2xl bg-white"
            classNames={{
              th: "bg-default-50 text-default-600 font-semibold h-12 first:rounded-l-2xl last:rounded-r-2xl",
              td: "py-4",
              wrapper: "p-0",
            }}
          >
            <TableHeader>
              <TableColumn>Support Description</TableColumn>
              <TableColumn>Support Type</TableColumn>
              <TableColumn>Admin Response</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Created At</TableColumn>
              <TableColumn>Updated At</TableColumn>
            </TableHeader>

            <TableBody
              isLoading={isLoading}
              emptyContent={"No records found."}
              loadingContent={<LoadingProgress />}
            >
              {(data ?? [])?.map((item) => (
                <TableRow
                  key={item._id}
                  className="border-b border-divider last:border-0 hover:bg-default-50 transition-colors"
                >
                  <TableCell>
                    <div className="max-w-[300px]">
                      <p className="text-sm text-foreground line-clamp-1 font-medium">
                        {item.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-default-600 font-medium">
                      {CommonUtils.formatTitle(item.type)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.adminResponse ? (
                      <div className="max-w-[200px] bg-primary-50 p-2 rounded-lg border border-primary-100">
                        <p className="text-xs text-primary-700 italic line-clamp-2">
                          {item.adminResponse}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-default-400 italic">
                        Waiting for response...
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={CommonUtils.getStatusColor(item.status)}
                      className="font-semibold"
                    >
                      {CommonUtils.formatTitle(item.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <TableDate date={item?.createdAt} />
                  </TableCell>
                  <TableCell>
                    <TableDate date={item?.updatedAt} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-12">
          <CityOfficeCard className="max-w-[650px]" />
        </div>
      </div>

      {data && data?.length > 0 && renderPagination()}
    </div>
  );
};

export default HelpSupportPage;
