import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, Info } from "lucide-react";
import { useSubmitFeedbackResponse } from "@/hooks/use-feedback-forms";
import { feedbackResponseSchema, type FeedbackResponseInput } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";
import type { FeedbackForm, FeedbackQuestion } from "@/types";

interface FeedbackSubmissionFormProps {
  form: FeedbackForm & {
    course: {
      id: string;
      name: string;
      code: string;
      teacher: string;
    };
  };
  studentAttendance: number;
  onSuccess?: () => void;
}

export function FeedbackSubmissionForm({ form, studentAttendance, onSuccess }: FeedbackSubmissionFormProps) {
  const { toast } = useToast();
  const submitResponse = useSubmitFeedbackResponse();
  const [responses, setResponses] = useState<Record<string, any>>({});

  const responseForm = useForm<FeedbackResponseInput>({
    resolver: zodResolver(feedbackResponseSchema),
    defaultValues: {
      formId: form.id,
      courseId: form.courseId,
      responses: {},
    },
  });

  const questions = form.questions as FeedbackQuestion[];
  const attendanceWeight = studentAttendance >= 90 ? 1.0 : 
                          studentAttendance >= 75 ? 0.9 :
                          studentAttendance >= 60 ? 0.7 :
                          studentAttendance >= 40 ? 0.5 :
                          studentAttendance >= 25 ? 0.3 : 0.1;

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const onSubmit = async () => {
    try {
      await submitResponse.mutateAsync({
        formId: form.id,
        courseId: form.courseId,
        responses,
      });
      
      toast({
        title: "Success",
        description: "Your feedback has been submitted successfully",
      });
      
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Feedback</h1>
        <p className="text-gray-600">Your feedback is anonymous and helps improve the learning experience</p>
      </div>

      {/* Form Card */}
      <Card>
        <CardContent className="p-8">
          {/* Course Info */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-medium text-sm">{form.course.code}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{form.course.name}</h3>
                <p className="text-sm text-gray-600">{form.course.teacher} • {form.title}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm text-gray-600">
              <Info className="h-4 w-4 mr-2 text-blue-500" />
              Your attendance: <span className="ml-1 font-medium text-emerald-600">{studentAttendance.toFixed(1)}%</span>
              <span className="ml-2 text-gray-400">• Weight factor: {attendanceWeight}</span>
            </div>
          </div>

          {/* Feedback Form */}
          <Form {...responseForm}>
            <form className="space-y-6">
              {/* Questions */}
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.id}>
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-3">
                      {question.text}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </FormLabel>

                    {question.type === 'rating' && (
                      <div className="flex items-center space-x-4">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <label key={rating} className="flex flex-col items-center cursor-pointer">
                            <input
                              type="radio"
                              name={`question_${question.id}`}
                              value={rating}
                              className="sr-only"
                              onChange={() => handleResponseChange(question.id, rating)}
                              data-testid={`radio-${question.id}-${rating}`}
                            />
                            <div 
                              className={`h-10 w-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors
                                ${responses[question.id] === rating 
                                  ? 'border-purple-500 bg-purple-500 text-white' 
                                  : 'border-gray-300 hover:border-purple-500'
                                }`}
                            >
                              {rating}
                            </div>
                            <span className="text-xs text-gray-500 mt-1">
                              {rating === 1 ? 'Poor' : rating === 5 ? 'Excellent' : ''}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'text' && (
                      <Textarea
                        rows={4}
                        className="w-full"
                        placeholder="Share your thoughts..."
                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                        data-testid={`textarea-${question.id}`}
                      />
                    )}

                    {question.type === 'select' && question.options && (
                      <Select onValueChange={(value) => handleResponseChange(question.id, value)}>
                        <SelectTrigger data-testid={`select-${question.id}`}>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {question.options.map((option, optionIndex) => (
                            <SelectItem key={optionIndex} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>

              {/* Anonymous Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-500 mt-1 mr-3" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Anonymous Submission</p>
                    <p>Your feedback is completely anonymous. Your attendance percentage is used only for weighting purposes and cannot be traced back to you.</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  data-testid="button-save-draft"
                >
                  Save Draft
                </Button>
                <Button 
                  type="button"
                  onClick={onSubmit}
                  disabled={submitResponse.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="button-submit-feedback"
                >
                  {submitResponse.isPending ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
