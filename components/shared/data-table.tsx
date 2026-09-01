'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Search,
  Trash2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';

import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';

const headerMap: Record<string, string> = {
  'quiz': 'کویز',
  'status': 'دۆخ',
  'difficulty': 'ئاستی قورسی',
  'questions': 'پرسیارەکان',
  'participants': 'بەشداربووان',
  'duration': 'ماوە',
  'created': 'دروستکراوە',
  'name': 'ناو',
  'email': 'ئیمەیڵ',
  'role': 'دەسەڵات',
  'actions': 'کردارەکان',
  'action': 'کردار',
  'points': 'خاڵەکان',
  'score': 'خاڵ',
  'rank': 'ڕیزبەندی',
  'category': 'جۆری بابەت',
  'quizzes': 'کویزەکان',
  'joined': 'تۆماربووە',
  'user': 'بەکارهێنەر',
  'target': 'ئامانج',
  'time': 'کات',
  'ip address': 'ناونیشانی IP',
  'details': 'زانیارییەکان',
  'description': 'ناساندن',
  'quiz count': 'ژمارەی کویز',
  'file name': 'ناوی فایل',
  'type': 'جۆر',
  'size': 'قەبارە',
  'uploaded': 'بارکراوە',
  'total points': 'کۆی خاڵەکان',
  'played': 'یاری کردووە',
  'won': 'بردوویەتی',
  'date': 'ڕێکەوت',
  'amount': 'بڕ',
  'user name': 'ناوی بەکارهێنەر',
  'resource': 'سەرچاوە',
};

const translateHeader = (header: string, language: string) => {
  if (language !== 'ku') return header;
  const key = header.toLowerCase().trim();
  return headerMap[key] || header;
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  searchKey?: string;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  onBulkDelete?: (rows: TData[]) => void;
  bulkActions?: (rows: TData[], clearSelection: () => void) => ReactNode;
  exportFilename?: string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  searchKey,
  searchPlaceholder = 'Search...',
  toolbar,
  onBulkDelete,
  bulkActions,
  exportFilename = 'export',
  pageSize = 10,
  emptyTitle = 'No results found',
  emptyDescription = 'Try adjusting your search or filters.',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { language } = useLanguage();

  const resolvedSearchPlaceholder = searchPlaceholder === 'Search...' && language === 'ku' ? 'گەڕان...' : searchPlaceholder;
  const resolvedEmptyTitle = emptyTitle === 'No results found' && language === 'ku' ? 'هیچ ئەنجامێک نەدۆزرایەوە' : emptyTitle;
  const resolvedEmptyDescription = emptyDescription === 'Try adjusting your search or filters.' && language === 'ku' ? 'هەوڵ بدە گەڕانەکەت یان فلتەرەکان بگۆڕیت.' : emptyDescription;

  const tableColumns = useMemo(() => {
    if (!onBulkDelete && !bulkActions) return columns;
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      ...columns,
    ] as ColumnDef<TData, TValue>[];
  }, [columns, onBulkDelete, bulkActions]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, columnFilters, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);



  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex h-10 items-center gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="rounded-md border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex border-b p-4">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {searchKey && (
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={resolvedSearchPlaceholder}
                value={
                  (table.getColumn(searchKey)?.getFilterValue() as string) ?? ''
                }
                onChange={(e) =>
                  table.getColumn(searchKey)?.setFilterValue(e.target.value)
                }
                className="ps-9"
              />
            </div>
          )}
          {toolbar}
        </div>

      </div>

      {selectedRows.length > 0 && (onBulkDelete || bulkActions) && (
        <div className="flex items-center justify-between rounded-md border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {language === 'ku' ? `${selectedRows.length} دێڕ هەڵبژێردراوە` : `${selectedRows.length} row(s) selected`}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions && bulkActions(selectedRows, () => setRowSelection({}))}
            {onBulkDelete && !bulkActions && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onBulkDelete(selectedRows);
                  setRowSelection({});
                }}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {language === 'ku' ? 'سڕینەوەی هەڵبژێردراوەکان' : 'Delete selected'}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11">
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center">
                        {typeof header.column.columnDef.header === 'string'
                          ? translateHeader(header.column.columnDef.header, language)
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getCanSort() && (
                          <button
                            onClick={header.column.getToggleSortingHandler()}
                            className="ms-1"
                          >
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'transition-colors',
                    row.getIsSelected() && 'bg-primary/5'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-32 p-0"
                >
                  <EmptyState title={resolvedEmptyTitle} description={resolvedEmptyDescription} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}

interface PaginationProps<TData> {
  table: ReturnType<typeof useReactTable<TData>>;
}

function DataTablePagination<TData>({ table }: PaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);
  const { language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        {language === 'ku'
          ? `پیشاندانی ${totalRows === 0 ? 0 : startRow}–${endRow} لە کۆی ${totalRows} ئەنجام`
          : `Showing ${totalRows === 0 ? 0 : startRow}–${endRow} of ${totalRows} results`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          {language === 'ku'
            ? `لاپەڕەی ${pageIndex + 1} لە ${table.getPageCount() || 1}`
            : `Page ${pageIndex + 1} of ${table.getPageCount() || 1}`}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
