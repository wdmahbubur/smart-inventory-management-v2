import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await usersApi.getAll();
      return res.data;
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }) => usersApi.updateRole(id, role),
    onSuccess: () => {
      // Refresh the users list automatically
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
