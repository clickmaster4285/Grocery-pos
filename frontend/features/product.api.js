// Placeholder for Product API hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

// Query Keys
const PRODUCT_QUERY_KEYS = {
  all: ['products'],
  lists: () => [...PRODUCT_QUERY_KEYS.all, 'list'],
  list: (filters) => [...PRODUCT_QUERY_KEYS.lists(), { filters }],
  details: () => [...PRODUCT_QUERY_KEYS.all, 'detail'],
  detail: (id) => [...PRODUCT_QUERY_KEYS.details(), id],
};

// Fetch all products
const fetchProducts = async ({ queryKey }) => {
  const [, , { filters }] = queryKey;
  const { page, limit, ...rest } = filters || {};
  const params = new URLSearchParams({ page, limit, ...rest });
  const { data } = await api.get(`/products?${params.toString()}`);
  return data;
};

export const useGetAllProducts = (filters) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.list(filters),
    queryFn: fetchProducts,
    placeholderData: (previousData) => previousData,
  });
};

// Fetch product by ID
const fetchProductById = async ({ queryKey }) => {
  const [, , id] = queryKey;
  if (!id) return null;
  const { data } = await api.get(`/products/${id}`);
  return data;
};

export const useGetProductById = (id) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.detail(id),
    queryFn: fetchProductById,
    enabled: !!id,
  });
};

const processProductData = (productData) => {
  const formData = new FormData();
  const processedProductData = { ...productData };

  processedProductData.variants = productData.variants?.map((variant, variantIndex) => {
    const newVariant = { ...variant };

    if (newVariant.supplier === '') {
      newVariant.supplier = null;
    }

    const imageFilesToAppend = [];
    const existingImageUrls = [];

    // Safely iterate over variant.images
    variant.images?.forEach((image) => {
      if (image instanceof File) {
        const formFieldName = `variant_${variantIndex}_image_${imageFilesToAppend.length}`;
        formData.append(formFieldName, image, image.name);
        imageFilesToAppend.push(image);
      } else if (typeof image === 'string') {
        existingImageUrls.push(image);
      }
    });
    newVariant.images = existingImageUrls;

    return newVariant;
  }) || []; // Default to empty array if productData.variants is null/undefined

  if (processedProductData.category === '') {
    processedProductData.category = null;
  }
  if (processedProductData.brand === '') {
    processedProductData.brand = null;
  }

  formData.append('productData', JSON.stringify(processedProductData));
  return formData;
};

// Create a new product
const createProduct = async (productData) => {
  const formData = processProductData(productData);
  const { data } = await api.post('/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  console.log("the data i am send from api to backend", data)
  return data;
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      toast.success('Product created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create product.');
    },
  });
};

// Update an existing product
const updateProduct = async ({ id, ...productData }) => {
  const formData = processProductData(productData);
  const { data } = await api.put(`/products/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.detail(variables.id) });
      toast.success('Product updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update product.');
    },
  });
};

// Delete a product (soft delete)
const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      toast.success('Product deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete product.');
    },
  });
};
