import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

const terminalShiftReportAPI = {
  getAll: (params) => api.get('/terminal-shift-reports', { params }),
  getById: (id) => api.get(`/terminal-shift-reports/${id}`),
};

const terminalShiftReportKeys = {
  all: ['terminalShiftReports'],
  lists: () => [...terminalShiftReportKeys.all, 'list'],
  list: (params) => [...terminalShiftReportKeys.lists(), params],
  details: () => [...terminalShiftReportKeys.all, 'detail'],
  detail: (id) => [...terminalShiftReportKeys.details(), id],
};

export const useGetTerminalShiftReports = (params, options) => {
  return useQuery({
    queryKey: terminalShiftReportKeys.list(params),
    queryFn: async () => {
      const response = await terminalShiftReportAPI.getAll(params);
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

export const useGetTerminalShiftReportById = (id, options) => {
  return useQuery({
    queryKey: terminalShiftReportKeys.detail(id),
    queryFn: async () => {
      const response = await terminalShiftReportAPI.getById(id);
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};
