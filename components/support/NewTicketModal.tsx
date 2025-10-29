import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { SupportTicket } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTicket: SupportTicket) => void;
}

const schema = yup.object({
  title: yup.string().required('Title is required').min(5, 'Title is too short.'),
  description: yup.string().required('Description is required').min(20, 'Please provide more detail.'),
  category: yup.string().oneOf(['Technical', 'Operational', 'HR Query', 'Other']).required('Category is required'),
  priority: yup.string().oneOf(['Low', 'Medium', 'High', 'Urgent']).required('Priority is required'),
}).defined();

type FormData = Pick<SupportTicket, 'title' | 'description' | 'category' | 'priority'>;

const NewTicketModal: React.FC<NewTicketModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<FormData>({
    resolver: yupResolver(schema) as Resolver<FormData>,
    defaultValues: { category: 'Technical', priority: 'Medium' }
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const newTicket = await api.createSupportTicket({
        ...data,
        status: 'Open',
        raisedById: user.id,
        raisedByName: user.name,
        assignedToId: null,
        assignedToName: null,
        resolvedAt: null,
        closedAt: null,
        rating: null,
        feedback: null
      });
      onSuccess(newTicket);
      reset();
    } catch (error) {
      // Parent component will show toast
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-card p-6 w-full max-w-lg m-4 animate-fade-in-scale" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <h3 className="text-lg font-bold text-primary-text mb-4">Create New Support Post</h3>
          <div className="space-y-4">
            <Input label="Title / Subject" registration={register('title')} error={errors.title?.message} />
            <div>
              <label className="block text-sm font-medium text-muted">Description</label>
              <textarea {...register('description')} rows={5} className={`mt-1 form-input ${errors.description ? 'form-input--error' : ''}`} />
              {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="category" control={control} render={({ field }) => (
                <Select label="Category" {...field} error={errors.category?.message}>
                  <option>Technical</option>
                  <option>Operational</option>
                  <option>HR Query</option>
                  <option>Other</option>
                </Select>
              )} />
              <Controller name="priority" control={control} render={({ field }) => (
                <Select label="Priority" {...field} error={errors.priority?.message}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </Select>
              )} />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Create Post</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTicketModal;
