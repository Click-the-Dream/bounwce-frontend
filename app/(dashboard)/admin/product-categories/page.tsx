"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  Check,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import useProduct from "@/app/hooks/use-product";

type ProductCategory = {
  id?: string | number;
  _id?: string | number;
  category_id?: string | number;
  name?: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

const getCategoryId = (category: ProductCategory) =>
  category.id ?? category._id ?? category.category_id;

export default function ProductCategoriesPage() {
  const { useGetProductCategories, createCategory, deleteCategory } =
    useProduct();
  const {
    data: response,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetProductCategories();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [deleteCandidate, setDeleteCandidate] =
    useState<ProductCategory | null>(null);

  const categories: ProductCategory[] = Array.isArray(response)
    ? response
    : Array.isArray(response?.categories)
      ? response.categories
      : [];

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) =>
      `${category.name ?? ""} ${category.description ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [categories, search]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanDescription = description.trim();
    if (!cleanName || createCategory.isPending) return;

    try {
      await createCategory.mutateAsync({
        name: cleanName,
        description: cleanDescription || "",
      });
      setName("");
      setDescription("");
    } catch {
      // The shared mutation reports API errors through the app's toast system.
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    const id = getCategoryId(deleteCandidate);
    if (id === null || id === undefined || deleteCategory.isPending) return;

    try {
      await deleteCategory.mutateAsync(String(id));
      setDeleteCandidate(null);
    } catch {
      // The shared mutation reports API errors through the app's toast system.
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600">
            <Tags size={20} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Product categories
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-6 text-slate-500">
              Create and maintain the categories vendors use when listing
              products. Changes will be reflected in product creation forms.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreate}
          className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-end"
        >
          <div>
            <label
              htmlFor="category-name"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Category name <span className="text-red-500">*</span>
            </label>
            <input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              required
              placeholder="e.g. Home & Living"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[13px] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>
          <div>
            <label
              htmlFor="category-description"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Description{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="category-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={240}
              placeholder="Briefly describe the products in this category"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[13px] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || createCategory.isPending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createCategory.isPending ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Create category
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h3 className="font-semibold text-slate-900">All categories</h3>
            <p className="mt-1 text-xs text-slate-500">
              {categories.length}{" "}
              {categories.length === 1 ? "category" : "categories"} configured
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories"
                aria-label="Search categories"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              title="Refresh categories"
              aria-label="Refresh categories"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={isFetching ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-slate-500">
            <LoaderCircle size={18} className="animate-spin" /> Loading product
            categories…
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <AlertCircle size={28} className="text-red-500" />
            <p className="mt-3 font-semibold text-slate-800">
              Could not load categories
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Check your connection and retry.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Try again
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
              <Tags size={20} />
            </div>
            <p className="mt-3 font-semibold text-slate-800">
              {search ? "No matching categories" : "No product categories yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Try a different search term."
                : "Create a category above to make it available to vendors."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCategories.map((category, index) => {
              const id = getCategoryId(category);
              const isDeleteTarget =
                deleteCandidate &&
                String(getCategoryId(deleteCandidate)) === String(id);
              return (
                <div
                  key={id ?? `${category.name ?? "category"}-${index}`}
                  className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                      <Tags size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="wrap-break-word text-sm font-semibold text-slate-900">
                        {category.name || "Unnamed category"}
                      </p>
                      <p className="mt-1 wrap-break-word text-sm text-slate-500">
                        {category.description?.trim() ||
                          "No description provided"}
                      </p>
                    </div>
                  </div>
                  {isDeleteTarget ? (
                    <div className="flex flex-wrap items-center justify-end gap-2 rounded-xl bg-red-50 p-2 sm:max-w-md">
                      <p className="mr-1 text-xs text-red-700">
                        Delete this category?
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleDelete()}
                        disabled={
                          deleteCategory.isPending ||
                          id === null ||
                          id === undefined
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleteCategory.isPending ? (
                          <LoaderCircle size={13} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCandidate(null)}
                        disabled={deleteCategory.isPending}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteCandidate(category)}
                      disabled={
                        id === null ||
                        id === undefined ||
                        deleteCategory.isPending
                      }
                      title={
                        id === null || id === undefined
                          ? "This category has no identifier and cannot be deleted from this screen"
                          : `Delete ${category.name ?? "category"}`
                      }
                      className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-red-100 px-3.5 py-2.5 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 sm:self-center"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
