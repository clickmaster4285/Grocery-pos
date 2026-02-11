### Product Module Import Statements

**Backend Imports:**

```javascript
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { createProductSchema, updateProductSchema } = require('../validation/product.validation');
const { transformEmptyStringsToNull, cleanupUploadedFiles, createInitialVariantHistory, checkVariantUniqueness } = require('../utils/product.utils');
const Joi = require('joi');
// Note: Joi.objectId = require('joi-objectid')(Joi); is an initialization, not a direct import.
const Category = require('./category.model');
const Brand = require('./brand.model');
const Supplier = require('./supplier.model');
const express = require('express');
const productController = require('../controllers/product.controller');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const upload = require('../middleware/upload');
```

**Frontend Imports:**

```javascript
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import * as z from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import {
  Edit, Trash2, ArrowUpDown, Eye, ChevronDown, ChevronRight, PlusCircle, Search, UploadCloud, Image as ImageIcon
} from 'lucide-react';

// Shared UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ComboBox } from '@/components/ui/combobox';

// API Hooks
import api from '@/lib/api';
import { useDeleteProduct, useGetAllProducts, useGetProductById, useCreateProduct, useUpdateProduct } from '@/features/product.api';
import { useGetAllCategories } from '@/features/category.api';
import { useGetAllBrands } from '@/features/brand.api';
import { useGetAllSuppliers } from '@/features/supplier.api';

// Other Hooks and Utilities
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';

// Product-specific Components
import ProductTable from './ProductTable';
```