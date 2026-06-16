"use client";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import LoadingProgress from "@/app/components/shared/LoadingProgress";
import PageHeaderWrapper from "@/app/components/shared/PageHeaderWrapper";
import TableDate from "@/app/components/tables/TableDate";
import usePagination from "@/app/hooks/usePagination";
import { HelpSupport } from "@/app/types/types";
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
import HelpSupportForm from "./HelpSupportForm";

const page = () => {
  const { page, setTotalPages, renderPagination } = usePagination();

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["help-supports", page],
    queryFn: async () => {
      const res: any = await api.get(ENDPOINTS.HELP_SUPPORT.LIST, {
        params: {
          page,
          limit: 10,
        },
      });
      setTotalPages(res?.pagination?.totalPages);
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
      </div>

      {data && data?.length > 0 && renderPagination()}
    </div>
  );
};

export default page;
