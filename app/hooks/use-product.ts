import { useContext } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { extractErrorMessage } from "../_utils/formatters";
import { onFailure, onSuccess } from "../_utils/notification";

const useProduct = () => {
  const { authDetails } = useContext(AuthContext);
  const client = api;
  const queryClient = useQueryClient();

  const handleFailure = (action: string, error: any) => {
    const message = extractErrorMessage(error);
    onFailure({ title: `${action} Failed`, message });
  };

  const handleSuccess = (action: string, message: string) => {
    onSuccess({ title: `${action} Successful`, message });
  };

  const createCategory = useMutation({
    mutationFn: async (categoryData) => {
      const response = await client.post("/products/categories", categoryData);
      return response.data.data;
    },
    onSuccess: () => {
      handleSuccess(
        "Category Creation",
        "Product category created successfully!",
      );
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
    },
    onError: (error) => handleFailure("Category Creation", error),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id) => {
      const response = await client.delete(`/products/categories/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      handleSuccess(
        "Category Deletion",
        "Product category deleted successfully!",
      );
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
    },
    onError: (error) => handleFailure("Category Deletion", error),
  });

  const useGetAllProducts = (filters = {}) => {
    return useInfiniteQuery({
      queryKey: ["products-infinite", filters],

      // 1. You must explicitly define the starting page here in v5
      initialPageParam: 1,

      queryFn: async ({ pageParam }) => {
        const { data } = await client.get("/store/products/", {
          params: {
            ...filters,
            page: pageParam,
            per_page: 12,
          },
        });
        // Ensure we return an array even if data is undefined
        return data?.data || [];
      },

      getNextPageParam: (lastPage: any[], allPages: any[]) => {
        // If the last page had 12 items, there's likely a next page
        return lastPage.length === 12 ? allPages.length + 1 : undefined;
      },
    });
  };

  const useGetMyProducts = () =>
    useQuery({
      queryKey: ["products", "my-products"],
      queryFn: async () => {
        const response = await client.get("/store/products/me");
        return response.data.data;
      },
      enabled: !!authDetails?.access_token,
    });

  const useGetStoreProducts = (storeId: any) =>
    useInfiniteQuery({
      queryKey: ["products", "store", storeId],

      queryFn: async ({ pageParam = 1 }) => {
        const response = await client.get(
          `/store/products/store/${storeId}?page=${pageParam}`,
        );
        return response.data?.data || [];
      },

      initialPageParam: 1,

      enabled: !!storeId,

      getNextPageParam: (lastPage) => {
        const currentPage = lastPage.page;
        const total = lastPage.total;
        const pageSize = lastPage.page_size;

        const totalPages = Math.ceil(total / pageSize);

        return currentPage < totalPages ? currentPage + 1 : undefined;
      },
    });

  const useGetProductCategories = () =>
    useQuery({
      queryKey: ["productCategories"],
      queryFn: async () => {
        const response = await client.get(`/store/products/categories`);
        return response.data.data;
      },
    });

  const useGetProductById = (id: any) =>
    useQuery({
      queryKey: ["product", id],
      queryFn: async () => {
        const response = await client.get(`/store/products/${id}`);
        return response.data.data;
      },
      enabled: !!id,
    });

  // PRODUCT MUTATIONS

  const createProduct = useMutation({
    mutationFn: async (productData) => {
      const response = await client.post("/store/products/", productData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    },
    onSuccess: () => {
      handleSuccess("Product Creation", "Product created successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    },
    onError: (error) => handleFailure("Product Creation", error),
  });

  const updateProduct = useMutation({
    mutationFn: async ({
      id,
      productData,
    }: {
      id: string;
      productData: any;
    }) => {
      const response = await client.put(`/store/products/${id}`, productData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      // Destructure what you need from variables
      const { id } = variables;

      handleSuccess("Product Update", "Product updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    },

    onError: (error: any) => handleFailure("Product Update", error),
  });

  const toggleProductState = useMutation({
    mutationFn: async (id) => {
      const response = await client.patch(`/store/products/${id}/toggle-state`);
      return response.data.data;
    },
    onSuccess: (_, id) => {
      handleSuccess(
        "Toggle Product State",
        "Product state updated successfully!",
      );
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    },
    onError: (error) => handleFailure("Toggle Product State", error),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id) => {
      const response = await client.delete(`/store/products/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      handleSuccess("Product Deletion", "Product deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    },
    onError: (error) => handleFailure("Product Deletion", error),
  });

  const deleteAllMyProducts = useMutation({
    mutationFn: async () => {
      const response = await client.delete("/products/me");
      return response.data.data;
    },
    onSuccess: () => {
      handleSuccess("Bulk Deletion", "All your products have been deleted.");
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
    },
    onError: (error) => handleFailure("Bulk Deletion", error),
  });

  const deleteProductImage = useMutation({
    mutationFn: async (productId) => {
      const response = await client.delete(`/products/${productId}/image`);
      return response.data.data;
    },
    onSuccess: (_, productId) => {
      handleSuccess("Image Deletion", "Product image deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
    onError: (error) => handleFailure("Image Deletion", error),
  });

  return {
    // Category
    useGetProductCategories,
    createCategory,
    deleteCategory,

    // Product fetch
    useGetAllProducts,
    useGetMyProducts,
    useGetStoreProducts,
    useGetProductById,

    // Product actions
    createProduct,
    updateProduct,
    toggleProductState,
    deleteProduct,
    deleteAllMyProducts,
    deleteProductImage,
  };
};

export default useProduct;
