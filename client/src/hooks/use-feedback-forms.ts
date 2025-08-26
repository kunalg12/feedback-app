import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { FeedbackForm, InsertFeedbackForm, FeedbackResponse, InsertFeedbackResponse } from '@shared/schema';

export const useFeedbackForms = () => {
  return useQuery<FeedbackForm[]>({
    queryKey: ['/api/feedback-forms'],
  });
};

export const useCreateFeedbackForm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (form: InsertFeedbackForm) => {
      const response = await apiRequest('POST', '/api/feedback-forms', form);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feedback-forms'] });
    },
  });
};

export const useFeedbackResponses = (formId: string) => {
  return useQuery<FeedbackResponse[]>({
    queryKey: ['/api/feedback-forms', formId, 'responses'],
    enabled: !!formId,
  });
};

export const useSubmitFeedbackResponse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (response: InsertFeedbackResponse) => {
      const res = await apiRequest('POST', '/api/feedback-responses', response);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/feedback-forms', variables.formId, 'responses'] 
      });
    },
  });
};

export const useCourseFeedbackResponses = (courseId: string) => {
  return useQuery<FeedbackResponse[]>({
    queryKey: ['/api/courses', courseId, 'feedback-responses'],
    enabled: !!courseId,
  });
};
