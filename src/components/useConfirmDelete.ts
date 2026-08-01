import { useState, useCallback } from 'react';
import React from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export function useConfirmDelete() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => Promise<void> | void) | null>(null);
  const [customMessage, setCustomMessage] = useState<string | undefined>(undefined);
  const [customTitle, setCustomTitle] = useState<string | undefined>(undefined);

  const confirmDelete = useCallback((callback: () => Promise<void> | void, message?: string, title?: string) => {
    setOnConfirmCallback(() => callback);
    setCustomMessage(message);
    setCustomTitle(title);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!onConfirmCallback) return;
    setIsLoading(true);
    try {
      await onConfirmCallback();
    } finally {
      setIsLoading(false);
      setIsOpen(false);
      setOnConfirmCallback(null);
    }
  }, [onConfirmCallback]);

  const handleCancel = useCallback(() => {
    if (isLoading) return;
    setIsOpen(false);
    setOnConfirmCallback(null);
  }, [isLoading]);

  const ConfirmDialog = useCallback(() => {
    return React.createElement(ConfirmDeleteModal, {
      isOpen,
      title: customTitle,
      message: customMessage,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
      isLoading,
    });
  }, [isOpen, customTitle, customMessage, handleConfirm, handleCancel, isLoading]);

  return {
    confirmDelete,
    ConfirmDialog,
    isOpen,
  };
}
