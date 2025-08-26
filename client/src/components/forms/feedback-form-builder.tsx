import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Eye } from "lucide-react";
import { useCourses } from "@/hooks/use-courses";
import { useCreateFeedbackForm } from "@/hooks/use-feedback-forms";
import { feedbackFormSchema, type FeedbackFormInput } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";
import type { FeedbackQuestion } from "@/types";

interface FeedbackFormBuilderProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FeedbackFormBuilder({ onSuccess, onCancel }: FeedbackFormBuilderProps) {
  const { toast } = useToast();
  const { data: courses = [] } = useCourses();
  const createForm = useCreateFeedbackForm();
  
  const form = useForm<FeedbackFormInput>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      questions: [
        {
          id: "1",
          text: "How would you rate the overall quality of this course?",
          type: "rating",
          required: true,
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const addQuestion = () => {
    const newQuestion: FeedbackQuestion = {
      id: Date.now().toString(),
      text: "",
      type: "rating",
      required: false,
    };
    append(newQuestion);
  };

  const onSubmit = async (data: FeedbackFormInput) => {
    try {
      await createForm.mutateAsync({
        ...data,
        teacherId: "", // Will be set by backend based on authenticated user
        questions: data.questions,
      });
      
      toast({
        title: "Success",
        description: "Feedback form created successfully",
      });
      
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create feedback form",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Feedback Form</h1>
          <p className="text-gray-600">Design a custom feedback form for your course</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel} data-testid="button-cancel">
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={createForm.isPending}
            data-testid="button-save-form"
          >
            {createForm.isPending ? "Saving..." : "Save Form"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Builder */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Form Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Form Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Mid-Semester Course Evaluation" 
                            {...field}
                            data-testid="input-form-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={3}
                            placeholder="Provide instructions or context for students"
                            {...field}
                            data-testid="textarea-form-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="courseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-course">
                                <SelectValue placeholder="Select a course" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.code} - {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              {...field}
                              value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                              data-testid="input-end-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Questions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Questions</CardTitle>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={addQuestion}
                      data-testid="button-add-question"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="border border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600">Question {index + 1}</span>
                          <div className="flex items-center space-x-2">
                            <FormField
                              control={form.control}
                              name={`questions.${index}.type`}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <SelectTrigger className="w-32 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="rating">Rating Scale</SelectItem>
                                    <SelectItem value="text">Text Input</SelectItem>
                                    <SelectItem value="select">Multiple Choice</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                data-testid={`button-remove-question-${index}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`questions.${index}.text`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="Enter your question"
                                  {...field}
                                  data-testid={`input-question-text-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                          <FormField
                            control={form.control}
                            name={`questions.${index}.required`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid={`checkbox-required-${index}`}
                                  />
                                </FormControl>
                                <FormLabel className="text-xs">Required</FormLabel>
                              </FormItem>
                            )}
                          />
                          {form.watch(`questions.${index}.type`) === 'rating' && (
                            <span>Scale: 1 (Poor) - 5 (Excellent)</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">
                  {form.watch("title") || "Form Title"}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {form.watch("description") || "Form description will appear here."}
                </p>
              </div>
              
              <div className="space-y-3">
                {form.watch("questions")?.map((question, index) => (
                  <div key={question.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {question.text || `Question ${index + 1}`}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {question.type === 'rating' && (
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            type="button"
                            className="h-8 w-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-sm hover:border-emerald-500"
                            disabled
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'text' && (
                      <Textarea
                        rows={3}
                        className="text-sm"
                        placeholder="Student response..."
                        disabled
                      />
                    )}
                    
                    {question.type === 'select' && (
                      <Select disabled>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
